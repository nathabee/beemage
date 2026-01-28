// src/panel/tabs/segmentation/view.ts
import type { Dom } from "../../app/dom";
import type { SegmentationModel } from "./model";

type SegmentationView = {
  set(model: SegmentationModel): void;
};

export function createSegmentationView(dom: Dom): SegmentationView {
  function getOrCreateReportEl(): HTMLPreElement {
    const host = dom.viewSegmentation;

    // Reuse if already created
    const existing = host.querySelector('pre[data-bct="seg-report"]') as HTMLPreElement | null;
    if (existing) return existing;

    // Create a simple report block appended at the end of the view
    const pre = document.createElement("pre");
    pre.className = "report";
    pre.setAttribute("data-bct", "seg-report");
    pre.setAttribute("aria-label", "Segmentation placeholder report");
    pre.style.marginTop = "10px";

    host.appendChild(pre);
    return pre;
  }

  function set(model: SegmentationModel) {
    // Try to update a status element if present in your placeholder HTML
    // (Optional; does nothing if not found.)
    const statusEl = dom.viewSegmentation.querySelector(".status") as HTMLElement | null;
    if (statusEl) statusEl.textContent = model.status;

    const reportEl = getOrCreateReportEl();
    reportEl.textContent = model.report;
  }

  return { set };
}
