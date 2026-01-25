// src/panel/tabs/colors/tab.ts
import type { Dom } from "../../app/dom";
import type { Bus } from "../../app/bus";

import { createColorsView } from "./view";
import { applyFillToImage, makePreviewFromClick } from "./model";

type TabApi = {
  bind(): void;
  boot?: () => void;
};

const PALETTE_20 = [
  "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be",
  "#007aff", "#5856d6", "#af52de", "#ff2d55", "#a2845e",
  "#8e8e93", "#1c1c1e", "#ffffff", "#000000", "#4cd964",
  "#5ac8fa", "#ff6b6b", "#7aa2ff", "#f5a623", "#50e3c2",
];

export function createColorsTab(dom: Dom, _bus: Bus): TabApi {
  const view = createColorsView(dom);

  // Working image for the Colors tab (starts as copy of outCanvas)
  let baseImg: ImageData | null = null;
  let preview: ReturnType<typeof makePreviewFromClick> extends { ok: true; preview: infer P } ? P : any = null;

  function setStatus(t: string) {
    view.setStatus(t);
  }

  function readOutCanvas(): ImageData | null {
    const ctx = dom.outCanvasEl.getContext("2d");
    if (!ctx) return null;

    const w = dom.outCanvasEl.width;
    const h = dom.outCanvasEl.height;
    if (w <= 0 || h <= 0) return null;

    return ctx.getImageData(0, 0, w, h);
  }

  function resetFromOutput() {
    const img = readOutCanvas();
    if (!img) {
      baseImg = null;
      preview = null;
      view.setApplyEnabled(false);
      view.setCancelEnabled(false);
      setStatus("No output available. Run Process first.");
      return;
    }

    baseImg = img;
    preview = null;
    view.drawBase(baseImg);
    view.setApplyEnabled(false);
    view.setCancelEnabled(false);
    setStatus("Ready. Pick a color, click inside a region.");
  }

  /**
   * Minimal requirement:
   * - When entering Colors tab, if we never initialized (baseImg==null)
   *   and contour output exists, prefill from outCanvas.
   * - If baseImg already exists, keep the user's work as-is.
   */
  function maybePrefillOnEnter() {
    if (baseImg) {
      // Keep the last edited state.
      view.drawBase(baseImg);
      return;
    }

    // Only prefill if contour output exists.
    const img = readOutCanvas();
    if (!img) {
      setStatus("No output available. Run Process first.");
      return;
    }

    baseImg = img;
    preview = null;
    view.drawBase(baseImg);
    view.setApplyEnabled(false);
    view.setCancelEnabled(false);
    setStatus("Loaded output. Pick a color, click inside a region.");
  }

  function applyPreview() {
    if (!baseImg || !preview) return;

    const hex = view.getSelectedColor();
    baseImg = applyFillToImage(baseImg, preview, hex);
    preview = null;

    view.drawBase(baseImg);
    view.setApplyEnabled(false);
    view.setCancelEnabled(false);
    setStatus("Fill applied. Click another region.");
  }

  function cancelPreview() {
    if (!baseImg) return;
    preview = null;
    view.drawBase(baseImg);
    view.setApplyEnabled(false);
    view.setCancelEnabled(false);
    setStatus("Preview canceled.");
  }

  return {
    bind() {
      view.bind();
      view.renderPalette(PALETTE_20);

      // Canvas click => compute preview
      view.onCanvasClick((x, y) => {
        if (!baseImg) {
          setStatus("No output available. Run Process first.");
          return;
        }

        const settings = view.getSettings();
        const res = makePreviewFromClick(baseImg, x, y, settings);

        if (!res.ok) {
          preview = null;
          view.setApplyEnabled(false);
          view.setCancelEnabled(false);
          setStatus(res.message);
          return;
        }

        preview = res.preview;
        view.drawPreview(baseImg, preview);
        view.setApplyEnabled(true);
        view.setCancelEnabled(true);
        setStatus("Preview shown. Apply fill or cancel.");
      });

      dom.btnColorsApplyEl.addEventListener("click", () => applyPreview());
      dom.btnColorsCancelEl.addEventListener("click", () => cancelPreview());
      dom.btnColorsResetEl.addEventListener("click", () => resetFromOutput());

      // Key change: when user navigates to Colors tab, prefill if empty.
      dom.tabColors.addEventListener("click", () => {
        // Let the tab system switch visibility first, then draw.
        queueMicrotask(() => maybePrefillOnEnter());
      });

      // Initial status. Do NOT reset from output automatically on boot,
      // otherwise it will take a snapshot before the user runs Process.
      setStatus("Idle");
      view.setApplyEnabled(false);
      view.setCancelEnabled(false);
    },
  };
}
