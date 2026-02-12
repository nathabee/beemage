// demo/src/mocks/engine/ops/removeSmallComponents.ts

import { removeSmallComponents as nativeRemoveSmallComponents } from "@panel/tabs/pipeline/lib/morphology";
import { getCvOrNull } from "./helpers/cv";

import { traceScope } from "@panel/app/log";

type MaskInput = { mask: Uint8Array; width: number; height: number };
type RemoveSmallParams = { cleanMinArea: number };

export function ocvRemoveSmallComponents(input: MaskInput, params: RemoveSmallParams): Uint8Array {
  const { width, height } = input;

  const minArea = Math.max(0, Math.floor(Number(params.cleanMinArea ?? 0)));
  traceScope("OpenCV removeSmallComponents params", { width, height, minArea });

  if (!width || !height) return input.mask;
  if (minArea <= 1) return input.mask;

  const cv = getCvOrNull();
  if (!cv) return nativeRemoveSmallComponents(input.mask, width, height, minArea);

  const src = new cv.Mat(height, width, cv.CV_8UC1);
  try {
    const srcData = src.data as Uint8Array;
    const m = input.mask;
    for (let i = 0; i < m.length; i++) srcData[i] = m[i] ? 255 : 0;

    const labels = new cv.Mat();
    const stats = new cv.Mat();
    const centroids = new cv.Mat();

    try {
      const nLabels: number = cv.connectedComponentsWithStats(src, labels, stats, centroids, 8, cv.CV_32S);

      const CC_STAT_AREA: number = (cv as any).CC_STAT_AREA ?? 4;

      const remove = new Array<boolean>(nLabels).fill(false);
      for (let lbl = 1; lbl < nLabels; lbl++) {
        const area = stats.intAt(lbl, CC_STAT_AREA);
        if (area < minArea) remove[lbl] = true;
      }

      // output 0/1
      const out = new Uint8Array(width * height);
      const labData = labels.data32S as Int32Array;

      for (let i = 0; i < out.length; i++) {
        const lbl = labData[i];
        out[i] = lbl > 0 && !remove[lbl] ? 1 : 0;
      }

      return out;
    } finally {
      labels.delete();
      stats.delete();
      centroids.delete();
    }
  } finally {
    src.delete();
  }
}
