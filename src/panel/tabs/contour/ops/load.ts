import type { Dom } from "../../../app/dom";
import { withBusy } from "../../../app/state";
import type { ContourTabState } from "../model"; 
import { loadContourTuningParams } from "./tuningParams";

// Use canonical logger + trace bridge
import { traceScope, logWarn, logError } from "../../../app/log";

export async function loadImageFromFile(
  dom: Dom,
  state: ContourTabState,
  file: File,
  helpers: {
    setStatus: (text: string) => void;
    setContourBusyVisual: (busy: boolean, status?: string) => void;
    clearCanvases: () => void;
    clearCleanCanvasesOnly: () => void;
    clearSvgPreview: () => void;
    updateEnabled: () => void;
    getNumber: (el: HTMLInputElement, fallback: number) => number;
  }
): Promise<void> {
  const {
    setStatus,
    setContourBusyVisual,
    clearCanvases,
    clearCleanCanvasesOnly,
    clearSvgPreview,
    updateEnabled,
    getNumber,
  } = helpers;

  if (!file.type.startsWith("image/")) {
    setStatus("Unsupported file type (please drop an image).");

    // This is user input / validation, not a crash:
    // warn in console, and persist via traceScope if debug is enabled.
    logWarn("Contour load: rejected non-image file", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    traceScope("Contour load: rejected non-image file", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    return;
  }

  const t0 = performance.now();

  await withBusy(dom, async () => {
    setContourBusyVisual(true, "Loading image…");

    state.loadedImageName = file.name || "image";
    const url = URL.createObjectURL(file);

    traceScope("Contour load: start", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error("Failed to load image"));
        im.src = url;
      });

      const canvas = dom.srcCanvasEl;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        logError("Contour load: missing 2D context", {
          canvasId: "srcCanvasEl",
        });
        setStatus("Load failed — canvas context not available.");
        return;
      }

      clearCanvases();
      const tp = await loadContourTuningParams();
      const scalePct = tp.contourScale;

      const userScale = scalePct / 100;

      let targetW = Math.max(64, Math.floor(img.naturalWidth * userScale));
      let targetH = Math.max(64, Math.floor(img.naturalHeight * userScale));

      const maxSide = 1600;
      const sideScale = Math.min(1, maxSide / Math.max(targetW, targetH));
      targetW = Math.max(64, Math.floor(targetW * sideScale));
      targetH = Math.max(64, Math.floor(targetH * sideScale));

      canvas.width = targetW;
      canvas.height = targetH;

      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      state.hasImage = true;
      state.hasOutput = false;

      state.edgeMask = undefined;
      state.repairedMask = undefined;
      state.smoothedMask = undefined;
      state.svgText = undefined;
      clearSvgPreview();

      clearCleanCanvasesOnly();
      updateEnabled();

      setStatus(`Loaded: ${state.loadedImageName} (${canvas.width}×${canvas.height})`);

      traceScope("Contour load: done", {
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        scalePct,
        maxSide,
        targetW,
        targetH,
        pixels: targetW * targetH,
        ms: Math.round((performance.now() - t0) * 10) / 10,
      });
    } catch (err) {
      logError("Contour load: exception", {
        error: err instanceof Error ? err.message : String(err),
      });
      setStatus("Load failed — see console / debug trace.");
    } finally {
      URL.revokeObjectURL(url);
      setContourBusyVisual(false);
    }
  });
}
