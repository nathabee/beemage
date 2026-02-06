// demo/src/mocks/engine/opsDispatchImpl.ts
export const OPS_IMPL_SOURCE = "demo" as const;

import type { OpImpls } from "../../../../src/panel/platform/opsDispatchCore";
import { logTrace, logWarn } from "../../../../src/panel/app/log";

import { ocvRemoveSmallComponents } from "./ops/removeSmallComponents";

import { thresholdManual } from "../../../../src/panel/tabs/pipeline/lib/threshold";
import { resizeNative } from "../../../../src/panel/tabs/pipeline/lib/resize";
import { denoiseNative } from "../../../../src/panel/tabs/pipeline/lib/denoise";
import { colorNative } from "../../../../src/panel/tabs/pipeline/lib/color";
import { morphologyNative } from "../../../../src/panel/tabs/pipeline/lib/morphology";
import { removeSmallComponents as nativeRemoveSmallComponents } from "../../../../src/panel/tabs/pipeline/lib/morphology";
import { edgeFromMask } from "../../../../src/panel/tabs/pipeline/lib/edge";

import { edgeMaskToSvg } from "../../../../src/panel/tabs/pipeline/lib/svg";


export const opImpls: OpImpls = {
  "mage.clean.removeSmallComponents": {
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

  // -----------------------------
  // Edge (pipeline)
  // -----------------------------
  "edge.resize": {
    native: (input, params) => {
      logTrace("[demo op] edge.resize native", {
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
      logTrace("[demo op] edge.resize opencv", { width: input.width, height: input.height });
      // for demo: still run native (until you add ocv variant)
      return resizeNative(input.image, input.width, input.height, {
        resizeAlgo: params.resizeAlgo,
        targetMaxW: params.targetMaxW,
      });
    },
  },

  "edge.threshold": {
    native: (input, params) => {
      logTrace("[demo op] edge.threshold native", {
        width: input.width,
        height: input.height,
        manualT: params.manualT,
      });
      return thresholdManual(input.image, input.width, input.height, { manualT: params.manualT });
    },
    opencv: (input, params) => {
      logTrace("[demo op] edge.threshold opencv", { width: input.width, height: input.height });
      return thresholdManual(input.image, input.width, input.height, { manualT: params.manualT });
    },
  },

  "edge.morphology": {
    native: (input, params) => {
      logTrace("[demo op] edge.morphology native", {
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
      logTrace("[demo op] edge.morphology opencv", { width: input.width, height: input.height });
      return morphologyNative(input.mask, input.width, input.height, {
        morphAlgo: params.morphAlgo,
        morphK: params.morphK,
        morphIters: params.morphIters,
      });
    },
  },

  "edge.extract": {
    native: (input, _params) => {
      logTrace("[demo op] edge.extract native", {
        width: input.width,
        height: input.height,
      });
      return edgeFromMask(input.mask, input.width, input.height);
    },
    opencv: (input, _params) => {
      logTrace("[demo op] edge.extract opencv", { width: input.width, height: input.height });
      // for demo: still run native (until you add ocv variant)
      return edgeFromMask(input.mask, input.width, input.height);
    },
  },

  "svg.create": {
    native: (input, params) => {
      logTrace("[demo op] svg.create native", { width: input.width, height: input.height, scale: params.scale });
      return edgeMaskToSvg(input.mask, input.width, input.height, {
        scale: params.scale,
        transparentBg: !!params.transparentBg,
        color: params.color,
      });
    },
    opencv: (input, params) => {
      logTrace("[demo op] svg.create opencv", { width: input.width, height: input.height, scale: params.scale });
      return edgeMaskToSvg(input.mask, input.width, input.height, {
        scale: params.scale,
        transparentBg: !!params.transparentBg,
        color: params.color,
      });
    },
  },


};
