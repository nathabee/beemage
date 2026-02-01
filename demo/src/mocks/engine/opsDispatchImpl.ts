// demo/src/mocks/engine/opsDispatchImpl.ts
export const OPS_IMPL_SOURCE = "demo" as const;

import type { OpImpls } from "../../../../src/panel/platform/opsDispatchCore";
import { logTrace } from "../../../../src/panel/app/log";

import { removeSmallComponents as nativeRemoveSmallComponents } from "../../../../src/panel/tabs/contour/lib/morphology";
import { ocvRemoveSmallComponents } from "./ops/removeSmallComponents";

import { thresholdManual } from "../../../../src/panel/tabs/segmentation/lib/threshold";
import { resizeNative } from "../../../../src/panel/tabs/segmentation/lib/resize";
import { denoiseNative } from "../../../../src/panel/tabs/segmentation/lib/denoise";
import { colorNative } from "../../../../src/panel/tabs/segmentation/lib/color";
import { morphologyNative } from "../../../../src/panel/tabs/segmentation/lib/morphology";


export const opImpls: OpImpls = {
  "contour.clean.removeSmallComponents": {
    native: (input, params) => {
      return nativeRemoveSmallComponents(input.mask, input.width, input.height, params.cleanMinArea);
    },
    opencv: (input, params) => {
      logTrace("OpenCV removeSmallComponents called (demo).", {
        width: input.width,
        height: input.height,
        cleanMinArea: params.cleanMinArea,
      });
      return ocvRemoveSmallComponents(input, params);
    },
  },

  // -----------------------------
  // Segmentation (native)
  // -----------------------------
// demo/src/mocks/engine/opsDispatchImpl.ts

"segmentation.resize": {
  native: (input, params) => {
    logTrace("[demo op] segmentation.resize native", {
      width: input.width,
      height: input.height,
      resizeAlgo: params.resizeAlgo,
      targetMaxW: params.targetMaxW,
    });
    return resizeNative(input.image, input.width, input.height, {
      resizeAlgo: params.resizeAlgo,
      targetMaxW: params.targetMaxW,
    });
  },
  opencv: (input, params) => {
    logTrace("[demo op] segmentation.resize opencv", { width: input.width, height: input.height });
    return resizeNative(input.image, input.width, input.height, {
      resizeAlgo: params.resizeAlgo,
      targetMaxW: params.targetMaxW,
    });
  },
},

"segmentation.denoise": {
  native: (input, params) => {
    logTrace("[demo op] segmentation.denoise native", {
      width: input.width,
      height: input.height,
      denoiseAlgo: params.denoiseAlgo,
      blurK: params.blurK,
      bilateralSigma: params.bilateralSigma,
    });
    return denoiseNative(input.image, input.width, input.height, {
      denoiseAlgo: params.denoiseAlgo,
      blurK: params.blurK,
      bilateralSigma: params.bilateralSigma,
    });
  },
  opencv: (input, params) => {
    logTrace("[demo op] segmentation.denoise opencv", { width: input.width, height: input.height });
    return denoiseNative(input.image, input.width, input.height, {
      denoiseAlgo: params.denoiseAlgo,
      blurK: params.blurK,
      bilateralSigma: params.bilateralSigma,
    });
  },
},

"segmentation.color": {
  native: (input, params) => {
    logTrace("[demo op] segmentation.color native", {
      width: input.width,
      height: input.height,
      colorMode: params.colorMode,
      hsvChannel: params.hsvChannel,
    });
    return colorNative(input.image, input.width, input.height, {
      colorMode: params.colorMode,
      hsvChannel: params.hsvChannel,
    });
  },
  opencv: (input, params) => {
    logTrace("[demo op] segmentation.color opencv", { width: input.width, height: input.height });
    return colorNative(input.image, input.width, input.height, {
      colorMode: params.colorMode,
      hsvChannel: params.hsvChannel,
    });
  },
},

"segmentation.threshold": {
  native: (input, params) => {
    logTrace("[demo op] segmentation.threshold native", {
      width: input.width,
      height: input.height,
      manualT: params.manualT,
    });
    return thresholdManual(input.image, input.width, input.height, { manualT: params.manualT });
  },
  opencv: (input, params) => {
    logTrace("[demo op] segmentation.threshold opencv", { width: input.width, height: input.height });
    return thresholdManual(input.image, input.width, input.height, { manualT: params.manualT });
  },
},

"segmentation.morphology": {
  native: (input, params) => {
    logTrace("[demo op] segmentation.morphology native", {
      width: input.width,
      height: input.height,
      morphAlgo: params.morphAlgo,
      morphK: params.morphK,
      morphIters: params.morphIters,
    });
    return morphologyNative(input.mask, input.width, input.height, {
      morphAlgo: params.morphAlgo,
      morphK: params.morphK,
      morphIters: params.morphIters,
    });
  },
  opencv: (input, params) => {
    logTrace("[demo op] segmentation.morphology opencv", { width: input.width, height: input.height });
    return morphologyNative(input.mask, input.width, input.height, {
      morphAlgo: params.morphAlgo,
      morphK: params.morphK,
      morphIters: params.morphIters,
    });
  },
},

};
