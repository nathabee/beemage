// src/panel/tabs/contour/view.ts

import type { Dom } from "../../app/dom";
import type { ContourTabState } from "./model";
import { computeMaskQuality } from "./lib/quality";

export type ContourTabView = {
  setStatus: (text: string) => void;
  setContourBusyVisual: (busy: boolean, status?: string) => void;

  updateEnabled: () => void;
  clearSvgPreview: () => void;

  clearCanvases: () => void;
  clearCleanCanvasesOnly: () => void;

  getNumber: (el: HTMLInputElement, fallback: number) => number;
  showError: (context: string, err: unknown) => void;

  updateCleanQualityUI: (width: number, height: number) => void;

  downloadPng: () => void;
  downloadSvg: () => void;
};

export function createContourTabView(dom: Dom, state: ContourTabState): ContourTabView {
  function setStatus(text: string) {
    dom.contourStatusEl.textContent = text;
  }

  function setContourBusyVisual(busy: boolean, status?: string) {
    dom.contourSpinnerEl.classList.toggle("is-hidden", !busy);
    if (status) setStatus(status);
  }

  function updateEnabled() {
    // Do not touch "busy" here; global busy state.ts will disable during operations.
    dom.btnProcessEl.disabled = !state.hasImage;
    dom.btnDownloadEl.disabled = !state.hasOutput;
    dom.btnCleanEl.disabled = !state.hasOutput;
    dom.btnVectorizeEl.disabled = !state.smoothedMask;
    dom.btnDownloadSvgEl.disabled = !state.svgText;
  }

  function clearSvgPreview(): void {
    state.svgText = undefined;
    dom.svgPreviewTextEl.textContent = "";
    dom.svgPreviewImgEl.removeAttribute("src");
  }

  function clearCanvases() {
    const sctx = dom.srcCanvasEl.getContext("2d")!;
    const octx = dom.outCanvasEl.getContext("2d")!;
    sctx.clearRect(0, 0, dom.srcCanvasEl.width, dom.srcCanvasEl.height);
    octx.clearRect(0, 0, dom.outCanvasEl.width, dom.outCanvasEl.height);

    const c1 = dom.clean1CanvasEl.getContext("2d")!;
    const c2 = dom.clean2CanvasEl.getContext("2d")!;
    c1.clearRect(0, 0, dom.clean1CanvasEl.width, dom.clean1CanvasEl.height);
    c2.clearRect(0, 0, dom.clean2CanvasEl.width, dom.clean2CanvasEl.height);
  }

  function clearCleanCanvasesOnly() {
    const c1 = dom.clean1CanvasEl.getContext("2d")!;
    const c2 = dom.clean2CanvasEl.getContext("2d")!;
    c1.clearRect(0, 0, dom.clean1CanvasEl.width, dom.clean1CanvasEl.height);
    c2.clearRect(0, 0, dom.clean2CanvasEl.width, dom.clean2CanvasEl.height);
  }

  function getNumber(el: HTMLInputElement, fallback: number) {
    const n = Number(el.value);
    return Number.isFinite(n) ? n : fallback;
  }

  function showError(context: string, err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    setStatus(`${context} failed: ${msg}`);

    // Ensure spinner is not left on
    setContourBusyVisual(false);

    // Dev visibility
    console.error(`[BeeContour] ${context} failed`, err);
  }

  function updateCleanQualityUI(width: number, height: number): void {
    if (!state.smoothedMask) {
      dom.cleanQualityBadgeEl.textContent = "—";
      dom.cleanQualityBadgeEl.className = "qBadge qBadge--off";
      dom.cleanQualityFillEl.style.width = "0%";
      dom.cleanQualityTextEl.textContent = "";
      return;
    }

    const qm = computeMaskQuality(state.smoothedMask, width, height);

    // Simple score 0..100 (interpretable, not magical)
    const norm = (v: number, max: number) => Math.max(0, Math.min(1, v / Math.max(1, max)));
    const ccN = norm(qm.components, 800);
    const endN = norm(qm.endpoints, 3000);
    const jN = norm(qm.junctions, 1500);

    // thicknessRatio tends to be ~1..3 for thin strokes; very high means blobs
    const thickPenalty = qm.thicknessRatio > 5 ? 1 : qm.thicknessRatio > 3 ? 0.5 : 0;

    const score = Math.round(
      100 * (1 - (0.45 * ccN + 0.45 * endN + 0.10 * jN) - 0.10 * thickPenalty)
    );
    const clamped = Math.max(0, Math.min(100, score));

    let cls = "qBadge qBadge--bad";
    let label = `Bad ${clamped}`;
    if (clamped >= 70) { cls = "qBadge qBadge--ok"; label = `Good ${clamped}`; }
    else if (clamped >= 45) { cls = "qBadge qBadge--warn"; label = `OK ${clamped}`; }

    dom.cleanQualityBadgeEl.className = cls;
    dom.cleanQualityBadgeEl.textContent = label;
    dom.cleanQualityFillEl.style.width = `${clamped}%`;

    dom.cleanQualityTextEl.textContent =
      `CC:${qm.components} end:${qm.endpoints} j:${qm.junctions} thick:${qm.thicknessRatio.toFixed(2)}`;
  }

  function downloadPng() {
    if (!state.hasOutput) return;

    const nameBase = (state.loadedImageName || "beecontour")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9-_]+/gi, "_");

    const filename = `${nameBase}_contour.png`;
    const url = dom.outCanvasEl.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setStatus(`Downloaded: ${filename}`);
  }

  function downloadSvg() {
    if (!state.svgText) return;

    const nameBase = (state.loadedImageName || "beecontour")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9-_]+/gi, "_");

    const filename = `${nameBase}_contour.svg`;

    const blob = new Blob([state.svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    setStatus(`Downloaded: ${filename}`);
  }

  return {
    setStatus,
    setContourBusyVisual,
    updateEnabled,
    clearSvgPreview,
    clearCanvases,
    clearCleanCanvasesOnly,
    getNumber,
    showError,
    updateCleanQualityUI,
    downloadPng,
    downloadSvg,
  };
}
