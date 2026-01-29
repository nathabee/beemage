import type { Dom } from "../../../app/dom";
import { withBusy } from "../../../app/state";
import type { ContourTabState } from "../model";
import { loadContourTuningParams } from "./tuningParams";

// Use canonical logger + trace bridge
import { traceScope, logWarn, logError } from "../../../app/log";

export async function processImage(
  dom: Dom,
  state: ContourTabState,
  helpers: {
    setStatus: (text: string) => void;
    setContourBusyVisual: (busy: boolean, status?: string) => void;
    clearCleanCanvasesOnly: () => void;
    clearSvgPreview: () => void;
    updateEnabled: () => void;
    getNumber: (el: HTMLInputElement, fallback: number) => number;
  }
): Promise<void> {
  const {
    setStatus,
    setContourBusyVisual,
    clearCleanCanvasesOnly,
    clearSvgPreview,
    updateEnabled,
    getNumber,
  } = helpers;

  if (!state.hasImage) {
    logWarn("Contour process: skipped (no image loaded)");
    return;
  }

  const t0 = performance.now();

  await withBusy(dom, async () => {
    setContourBusyVisual(true, "Processing…");

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        void (async () => {
          try {
            const src = dom.srcCanvasEl;
            const out = dom.outCanvasEl;

            const width = src.width;
            const height = src.height;
            const pixels = width * height;

            const tp = await loadContourTuningParams();
            const threshold = tp.edgeThreshold;
            const whiteBg = tp.invertOutput;


            traceScope("Contour process: start", {
              width,
              height,
              pixels,
              threshold,
              whiteBg,
            });

            out.width = width;
            out.height = height;



            const octx = out.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
            const sctx = src.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;


            if (!sctx || !octx) {
              logError("Contour process: missing 2D context", {
                hasSrc: !!sctx,
                hasOut: !!octx,
              });
              setStatus("Process failed — canvas context not available.");
              return;
            }

            const img = sctx.getImageData(0, 0, width, height);
            const data = img.data;

            const gray = new Uint8ClampedArray(width * height);
            for (let i = 0, p = 0; i < data.length; i += 4, p++) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              gray[p] = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
            }

            const gxKernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
            const gyKernel = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

            const mag = new Uint8ClampedArray(width * height);

            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                let gx = 0;
                let gy = 0;

                let k = 0;
                for (let j = -1; j <= 1; j++) {
                  for (let i2 = -1; i2 <= 1; i2++) {
                    const v = gray[(y + j) * width + (x + i2)];
                    gx += v * gxKernel[k];
                    gy += v * gyKernel[k];
                    k++;
                  }
                }

                const m = Math.min(255, Math.sqrt(gx * gx + gy * gy) | 0);
                mag[y * width + x] = m >= threshold ? 255 : 0;
              }
            }

            const outImg = octx.createImageData(width, height);
            const outData = outImg.data;

            let edgePixels = 0;
            for (let p = 0, i = 0; p < mag.length; p++, i += 4) {
              const v = mag[p];
              if (v === 255) edgePixels++;

              if (whiteBg) {
                const isEdge = v === 255;
                const px = isEdge ? 0 : 255;
                outData[i] = px;
                outData[i + 1] = px;
                outData[i + 2] = px;
                outData[i + 3] = 255;
              } else {
                outData[i] = v;
                outData[i + 1] = v;
                outData[i + 2] = v;
                outData[i + 3] = 255;
              }
            }

            octx.putImageData(outImg, 0, 0);

            state.hasOutput = true;
            state.edgeMask = undefined;
            state.repairedMask = undefined;
            state.smoothedMask = undefined;
            clearSvgPreview();

            clearCleanCanvasesOnly();
            setStatus("Done. You can clean/smooth or download the PNG.");

            traceScope("Contour process: done", {
              width,
              height,
              pixels,
              threshold,
              whiteBg,
              edgePixels,
              edgeRatio: Math.round((edgePixels / Math.max(1, pixels)) * 1e6) / 1e6,
              ms: Math.round((performance.now() - t0) * 10) / 10,
            });
          } catch (err) {
            logError("Contour process: exception", {
              error: err instanceof Error ? err.message : String(err),
            });
            setStatus("Process failed — see console / debug trace.");
          } finally {
            resolve();
          }
        })();
      }, 0);
    });

    setContourBusyVisual(false);
    updateEnabled();
  });
}
