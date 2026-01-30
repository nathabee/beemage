// demo/src/mocks/engine/opsDispatchImpl.ts
import type { OpImpls } from "../../../../src/panel/platform/opsDispatchCore";
import { logTrace } from "../../../../src/panel/app/log";
import { removeSmallComponents as nativeRemoveSmallComponents } from "../../../../src/panel/tabs/contour/lib/morphology";
import { ocvRemoveSmallComponents } from "./ops/removeSmallComponents";
import { thresholdManual } from "../../../../src/panel/tabs/segmentation/lib/threshold";



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
  // Segmentation (demo): start with pass-through stubs
  // Later swap opencv: to real cv.Mat-based implementations
  // -----------------------------
  "segmentation.resize": {
    native: (input) => input.image,
    opencv: (input) => {
      logTrace("OpenCV segmentation.resize called (demo) [stub].");
      return input.image;
    },
  },

  "segmentation.denoise": {
    native: (input) => input.image,
    opencv: (input) => {
      logTrace("OpenCV segmentation.denoise called (demo) [stub].");
      return input.image;
    },
  },

  "segmentation.color": {
    native: (input) => input.image,
    opencv: (input) => {
      logTrace("OpenCV segmentation.color called (demo) [stub].");
      return input.image;
    },
  },

"segmentation.threshold": {
  native: (input, params) => {
    return thresholdManual(input.image, input.width, input.height, { manualT: params.manualT });
  },
  opencv: (input, params) => {
    logTrace("OpenCV segmentation.threshold called (demo) [stub].");
    // For now, just call the same native implementation so output is meaningful.
    return thresholdManual(input.image, input.width, input.height, { manualT: params.manualT });
  },
},


  "segmentation.morphology": {
    native: (input) => input.mask,
    opencv: (input) => {
      logTrace("OpenCV segmentation.morphology called (demo) [stub].");
      return input.mask;
    },
  },
};
