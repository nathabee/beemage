// src/panel/tabs/segmentation/tab.ts
import type { Dom } from "../../app/dom";
import type { createBus } from "../../app/bus";
import { logTrace, logWarn, logError, traceScope } from "../../app/log";
import { withBusy } from "../../app/state";

import type { TuningController } from "../../app/tuning/controller";

import { createSegmentationModel } from "./model";
import { createSegmentationView } from "./view";
import { runSegmentationPipeline } from "./ops/segmentation";

// Reuse existing helper to display a 0/1 mask as ImageData
import { renderMask } from "../contour/lib/morphology";

type Bus = ReturnType<typeof createBus>;

export function createSegmentationTab(dom: Dom, _bus: Bus, tuningController: TuningController) {
  const model = createSegmentationModel();
  const view = createSegmentationView(dom, tuningController);

  function setStatus(text: string) {
    dom.segStatusEl.textContent = text || "";
  }

  async function runOnce(): Promise<void> {
    const srcCanvas = dom.outCanvasEl; // pragmatic choice for now
    const width = srcCanvas.width;
    const height = srcCanvas.height;

    if (!width || !height) {
      logWarn("[segmentation] run skipped: source canvas has no size");
      setStatus("No image");
      return;
    }

    const sctx = srcCanvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
    if (!sctx) {
      logError("[segmentation] missing 2D context on source canvas");
      setStatus("No canvas context");
      return;
    }

    const img = sctx.getImageData(0, 0, width, height);

    dom.segMaskCanvasEl.width = width;
    dom.segMaskCanvasEl.height = height;

    const mctx = dom.segMaskCanvasEl.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
    if (!mctx) {
      logError("[segmentation] missing 2D context on segMaskCanvas");
      setStatus("No preview context");
      return;
    }

    traceScope("[segmentation] run start", { width, height });

    const out = await runSegmentationPipeline(
      { width, height },
      { kind: "image", image: img },
    );

    if (out.kind !== "mask") {
      setStatus("No mask output");
      return;
    }

    // white background, black foreground (same convention as contour renderMask)
    mctx.putImageData(renderMask(out.mask, width, height, true), 0, 0);

    setStatus("Done");
    traceScope("[segmentation] run done", { width, height });
  }

  function bind() {
    dom.segRunBtn.addEventListener("click", () => {
      void withBusy(dom, async () => {
        setStatus("Running…");
        try {
          await runOnce();
        } catch (err) {
          logError("[segmentation] run exception", { error: err instanceof Error ? err.message : String(err) });
          setStatus("Failed");
        }
      });
    });
  }

  function mount() {
    logTrace("[segmentation] mount");
    setStatus("Idle");
    view.set(model);
  }

  function refresh() {
    logTrace("[segmentation] refresh");
    view.set(model);
  }

  function unmount() {}

  function dispose() {
    view.dispose();
  }

  return { bind, mount, refresh, unmount, dispose };
}
