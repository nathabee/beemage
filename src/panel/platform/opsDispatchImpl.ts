// src/panel/platform/opsDispatchImpl.ts
import { logWarn } from "../app/log";
import { removeSmallComponents } from "../tabs/contour/lib/morphology";
import type { OpImpls } from "./opsDispatchCore";
import { thresholdManual } from "../tabs/segmentation/lib/threshold";


export const opImpls: OpImpls = {
  "contour.clean.removeSmallComponents": {
    native: (input, params) => {
      return removeSmallComponents(input.mask, input.width, input.height, params.cleanMinArea);
    },
    opencv: (input, params) => {
      logWarn("OpenCV removeSmallComponents requested, falling back to native (extension build).");
      return removeSmallComponents(input.mask, input.width, input.height, params.cleanMinArea);
    },
  },

  // Segmentation stubs (extension)
  "segmentation.resize": {
    native: (input) => input.image,
    opencv: (input) => {
      logWarn("OpenCV segmentation.resize requested, falling back to native (extension build).");
      return input.image;
    },
  },
  "segmentation.denoise": {
    native: (input) => input.image,
    opencv: (input) => {
      logWarn("OpenCV segmentation.denoise requested, falling back to native (extension build).");
      return input.image;
    },
  },
  "segmentation.color": {
    native: (input) => input.image,
    opencv: (input) => {
      logWarn("OpenCV segmentation.color requested, falling back to native (extension build).");
      return input.image;
    },
  },
  "segmentation.threshold": {
    native: (input, params) => {
      return thresholdManual(input.image, input.width, input.height, { manualT: params.manualT });
    },
    opencv: (input, params) => {
      logWarn("OpenCV segmentation.threshold requested, falling back to native (extension build).");
      return thresholdManual(input.image, input.width, input.height, { manualT: params.manualT });
    },
  },

  "segmentation.morphology": {
    native: (input) => input.mask,
    opencv: (input) => {
      logWarn("OpenCV segmentation.morphology requested, falling back to native (extension build).");
      return input.mask;
    },
  },
};
