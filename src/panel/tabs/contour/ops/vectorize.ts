// src/panel/tabs/contour/ops/vectorize.ts

import type { Dom } from "../../../app/dom";
import { withBusy } from "../../../app/state";

import type { ContourTabState } from "../model";

import { traceBoundaries } from "../lib/trace";
import { rdpSimplifyIterative, chaikinSmooth } from "../lib/simplify";
import { buildSvgFromPolylines } from "../lib/svg";

// Use canonical logger + trace bridge
import { traceScope, logWarn, logError } from "../../../app/log";

type VectorizeUi = {
  setStatus: (text: string) => void;
  setContourBusyVisual: (busy: boolean, status?: string) => void;
  updateEnabled: () => void;
  showError: (context: string, err: unknown) => void;
  getNumber: (el: HTMLInputElement, fallback: number) => number;
};

export async function vectorizeToSvg(dom: Dom, state: ContourTabState, ui: VectorizeUi): Promise<void> {
  if (!state.smoothedMask) {
    logWarn("Contour vectorize: skipped (no smoothed mask present)");
    return;
  }

  const t0 = performance.now();

  await withBusy(dom, async () => {
    ui.setContourBusyVisual(true, "Vectorizing…");

    const clearPreview = () => {
      state.svgText = undefined;
      dom.svgPreviewTextEl.textContent = "";
      dom.svgPreviewImgEl.removeAttribute("src");
    };

    try {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          void (async () => {
            try {
              const mask = state.smoothedMask!;
              const width = dom.outCanvasEl.width;
              const height = dom.outCanvasEl.height;
              const pixels = width * height;

              const epsilon = 1.5;
              const smoothIters = Math.max(0, Math.min(4, (ui.getNumber(dom.pathSmoothItersEl, 2) | 0)));

              traceScope("Contour vectorize: start", { width, height, pixels, epsilon, smoothIters });

              const polylines = traceBoundaries(mask, width, height);

              const pathsRaw = polylines.length;
              const pointsRaw = polylines.reduce((sum, p) => sum + p.length, 0);
              const maxPolyline = polylines.reduce((m, p) => Math.max(m, p.length), 0);

              // Early exit: nothing found
              if (pathsRaw === 0 || pointsRaw === 0) {
                logWarn("Contour vectorize: no boundaries found", { width, height, pixels, pathsRaw, pointsRaw });
                clearPreview();
                ui.setStatus("No boundaries found to vectorize.");
                resolve();
                return;
              }

              // Early exit: too complex to safely build SVG
              if (pathsRaw > 2000 || pointsRaw > 200000) {
                logWarn("Contour vectorize: aborted (too complex)", {
                  width,
                  height,
                  pixels,
                  pathsRaw,
                  pointsRaw,
                  maxPolyline,
                });
                clearPreview();
                ui.setStatus(
                  `Vectorize aborted: too complex (paths ${pathsRaw}, points ${pointsRaw}). Try stronger clean / higher minArea / lower resolution.`
                );
                resolve();
                return;
              }

              traceScope("Contour vectorize: traced boundaries", { pathsRaw, pointsRaw, maxPolyline });

              const processed = polylines
                .filter((pts) => pts.length >= 20)
                .map((pts) => {
                  const s1 = rdpSimplifyIterative(pts, epsilon);
                  const sm = smoothIters > 0 ? chaikinSmooth(s1, smoothIters) : s1;
                  const s2 = rdpSimplifyIterative(sm, epsilon);
                  return s2;
                })
                .filter((pts) => pts.length >= 3);

              const pathsOut = processed.length;
              const pointsOut = processed.reduce((sum, p) => sum + p.length, 0);
              const maxOut = processed.reduce((m, p) => Math.max(m, p.length), 0);

              if (pathsOut === 0 || pointsOut === 0) {
                logWarn("Contour vectorize: simplified to nothing", {
                  pathsRaw,
                  pointsRaw,
                  pathsOut,
                  pointsOut,
                  smoothIters,
                  epsilon,
                });
                clearPreview();
                ui.setStatus("Vectorize produced no usable paths (after simplification).");
                resolve();
                return;
              }

              traceScope("Contour vectorize: simplified", { pathsOut, pointsOut, maxOut, smoothIters, epsilon });

              const svg = buildSvgFromPolylines(processed, width, height);

              state.svgText = svg;
              dom.svgPreviewTextEl.textContent = svg;

              const encoded = encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22");
              dom.svgPreviewImgEl.src = `data:image/svg+xml;charset=utf-8,${encoded}`;

              ui.setStatus(`SVG generated: paths ${pathsOut}, points ${pointsRaw}→${pointsOut}, smooth ${smoothIters}`);

              traceScope("Contour vectorize: done", {
                width,
                height,
                pixels,
                smoothIters,
                epsilon,
                pathsRaw,
                pointsRaw,
                pathsOut,
                pointsOut,
                svgChars: svg.length,
                ms: Math.round((performance.now() - t0) * 10) / 10,
              });

              resolve();
            } catch (e) {
              logError("Contour vectorize: exception", {
                error: e instanceof Error ? e.message : String(e),
                ms: Math.round((performance.now() - t0) * 10) / 10,
              });
              reject(e);
            }
          })();
        }, 0);
      });
    } catch (err) {
      ui.showError("Vectorize", err);
      clearPreview();
    } finally {
      ui.setContourBusyVisual(false);
      ui.updateEnabled();
    }
  });
}
