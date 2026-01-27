// src/panel/tabs/contour/tab.ts

import type { Dom } from "../../app/dom";
import type { Bus } from "../../app/bus";

import { createInitialContourTabState, resetContourTabState } from "./model";
import { createContourTabView } from "./view";

import { loadImageFromFile } from "./ops/load";
import { processImage } from "./ops/process";
import { cleanOutput } from "./ops/clean";
import { vectorizeToSvg } from "./ops/vectorize";

export function createContourTab(dom: Dom, _bus: Bus) {
  const state = createInitialContourTabState();
  const view = createContourTabView(dom, state);

  function bindDragDrop() {
    const dz = dom.dropZoneEl;

    function setHover(on: boolean) {
      dz.classList.toggle("is-hover", on);
    }

    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      setHover(true);
    });

    dz.addEventListener("dragleave", () => setHover(false));

    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      setHover(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      void loadImageFromFile(dom, state, files[0], {
        setStatus: view.setStatus,
        setContourBusyVisual: view.setContourBusyVisual,
        clearCanvases: view.clearCanvases,
        clearCleanCanvasesOnly: view.clearCleanCanvasesOnly,
        clearSvgPreview: view.clearSvgPreview,
        updateEnabled: view.updateEnabled,
        getNumber: view.getNumber,
      });
    });

    dom.fileInputEl.addEventListener("change", () => {
      const f = dom.fileInputEl.files?.[0];
      if (!f) return;

      void loadImageFromFile(dom, state, f, {
        setStatus: view.setStatus,
        setContourBusyVisual: view.setContourBusyVisual,
        clearCanvases: view.clearCanvases,
        clearCleanCanvasesOnly: view.clearCleanCanvasesOnly,
        clearSvgPreview: view.clearSvgPreview,
        updateEnabled: view.updateEnabled,
        getNumber: view.getNumber,
      });

      dom.fileInputEl.value = "";
    });
  }

  function bind() {
    bindDragDrop();

    dom.btnDownloadEl.addEventListener("click", () => view.downloadPng());
    dom.btnDownloadSvgEl.addEventListener("click", () => view.downloadSvg());

    dom.btnProcessEl.addEventListener("click", () => {
      void processImage(dom, state, {
        setStatus: view.setStatus,
        setContourBusyVisual: view.setContourBusyVisual,
        clearCleanCanvasesOnly: view.clearCleanCanvasesOnly,
        clearSvgPreview: view.clearSvgPreview,
        updateEnabled: view.updateEnabled,
        getNumber: view.getNumber,
      });
    });

    dom.btnCleanEl.addEventListener("click", () => {
      void cleanOutput(dom, state, {
        setStatus: view.setStatus,
        setContourBusyVisual: view.setContourBusyVisual,
        clearSvgPreview: view.clearSvgPreview,
        updateEnabled: view.updateEnabled,
        getNumber: view.getNumber,
        updateCleanQualityUI: view.updateCleanQualityUI,
      });
    });

    dom.btnVectorizeEl.addEventListener("click", () => {
      void vectorizeToSvg(dom, state, {
        setStatus: view.setStatus,
        setContourBusyVisual: view.setContourBusyVisual,
        updateEnabled: view.updateEnabled,
        showError: view.showError,
        getNumber: view.getNumber,
      });
    });


    // initial UI
    resetContourTabState(state);
    view.clearSvgPreview();
    view.updateEnabled();
    view.setStatus("No image loaded");
    dom.contourSpinnerEl.classList.add("is-hidden");
  }

  function mount() {
    // no-op for now
  }

  function unmount() {
    // no-op for now
  }

  return {
    id: "contour" as const,
    bind,
    mount,
    unmount,
  };
}
