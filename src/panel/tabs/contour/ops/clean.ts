import type { Dom } from "../../../app/dom";
import { withBusy } from "../../../app/state";

import type { ContourTabState } from "../model";
import { computeMaskQuality } from "../lib/quality";
import {
  clampInt,
  dilate,
  erode,
  removeSmallComponents,
  renderMask,
} from "../lib/morphology";

// Reuse canonical logger (includes traceScope).
// NOTE: traceScope will persist only if Debug enabled is ON (via debugTrace.append no-op).
import { traceScope, logWarn, logError } from "../../../app/log";

export async function cleanOutput(
  dom: Dom,
  state: ContourTabState,
  helpers: {
    setStatus: (text: string) => void;
    setContourBusyVisual: (busy: boolean, status?: string) => void;
    clearSvgPreview: () => void;
    updateEnabled: () => void;
    getNumber: (el: HTMLInputElement, fallback: number) => number;
    updateCleanQualityUI: (width: number, height: number) => void;
  }
): Promise<void> {
  const {
    setStatus,
    setContourBusyVisual,
    clearSvgPreview,
    updateEnabled,
    getNumber,
    updateCleanQualityUI,
  } = helpers;

  if (!state.hasOutput) {
    logWarn("Contour clean: skipped (no output present)");
    return;
  }

  const t0 = performance.now();

  await withBusy(dom, async () => {
    setContourBusyVisual(true, "Cleaning…");

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        void (async () => {
          try {
            const out = dom.outCanvasEl;
            const c1 = dom.clean1CanvasEl;
            const c2 = dom.clean2CanvasEl;

            traceScope("Contour clean: raw inputs", {
              cleanRadiusVal: dom.cleanRadiusEl.value,
              cleanMinAreaVal: dom.cleanMinAreaEl.value,
              cleanBinaryThresholdVal: dom.cleanBinaryThresholdEl.value,
            });


            const radius = clampInt(getNumber(dom.cleanRadiusEl, 1), 1, 3);
            const minArea = clampInt(getNumber(dom.cleanMinAreaEl, 12), 0, 500);
            const EDGE_T = clampInt(getNumber(dom.cleanBinaryThresholdEl, 128), 1, 254);

            c1.width = out.width;
            c1.height = out.height;
            c2.width = out.width;
            c2.height = out.height;

            const width = out.width;
            const height = out.height;
            const pixels = width * height;

            const whiteBg = dom.invertOutputEl.checked; 

            traceScope("Contour clean: start", {
              width,
              height,
              pixels,
              whiteBg,
              EDGE_T,
              minArea,
              radius,
            });


            const octx = out.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
            const c1ctx = c1.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
            const c2ctx = c2.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;

            if (!octx || !c1ctx || !c2ctx) {
              logError("Contour clean: missing 2D context", {
                hasOut: !!octx,
                hasC1: !!c1ctx,
                hasC2: !!c2ctx,
              });
              setStatus("Clean failed — canvas context not available.");
              return;
            }

 

            const outImg = octx.getImageData(0, 0, width, height);
            const data = outImg.data;

            const edge = new Uint8Array(width * height);
            let edgeOn = 0;
            for (let p = 0, i = 0; p < edge.length; p++, i += 4) {
              const r = data[i];
              const isEdge = whiteBg ? r < EDGE_T : r >= EDGE_T;
              const v = isEdge ? 1 : 0;
              edge[p] = v;
              if (v === 1) edgeOn++;
            }

            traceScope("Contour removeSmallComponents: params", { edge, width, height, minArea });


            const edgeNoSpeck = removeSmallComponents(edge, width, height, minArea);

            traceScope("Contour erode : params", { edgeNoSpeck, width, height, radius });
            const repaired = erode(
              dilate(edgeNoSpeck, width, height, radius),
              width,
              height,
              radius
            );
            c1ctx.putImageData(renderMask(repaired, width, height, whiteBg), 0, 0);

            traceScope("Contour dilate : params", { repaired, width, height, radius });
            const opened = dilate(
              erode(repaired, width, height, radius),
              width,
              height,
              radius
            );
            traceScope("Contour erode : params", { opened, width, height, radius });
            const smoothed = erode(
              dilate(opened, width, height, radius),
              width,
              height,
              radius
            );
            c2ctx.putImageData(renderMask(smoothed, width, height, whiteBg), 0, 0);

            state.edgeMask = edge;
            state.repairedMask = repaired;
            state.smoothedMask = smoothed;

            clearSvgPreview();

            const qm = computeMaskQuality(smoothed, width, height);
            updateCleanQualityUI(width, height);

            setStatus(
              `Clean done — CC:${qm.components} endpoints:${qm.endpoints} junctions:${qm.junctions} thickness:${qm.thicknessRatio.toFixed(
                2
              )}`
            );

            traceScope("Contour clean: done", {
              width,
              height,
              pixels,
              whiteBg,
              EDGE_T,
              minArea,
              radius,
              edgeOn,
              edgeRatio: Math.round((edgeOn / Math.max(1, pixels)) * 1e6) / 1e6,
              quality: qm,
              ms: Math.round((performance.now() - t0) * 10) / 10,
            });
          } catch (err) {
            logError("Contour clean: exception", {
              error: err instanceof Error ? err.message : String(err),
            });
            setStatus("Clean failed — see console / debug trace.");
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
