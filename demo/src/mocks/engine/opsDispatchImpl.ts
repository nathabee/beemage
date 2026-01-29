import type { MaskOpImpls } from "../../../../src/panel/platform/opsDispatchCore";
import { logTrace } from "../../../../src/panel/app/log";
import { removeSmallComponents as nativeRemoveSmallComponents } from "../../../../src/panel/tabs/contour/lib/morphology";
import { ocvRemoveSmallComponents } from "./ops/removeSmallComponents";

// NO AWAIT IF IT IS NOT EXPECTED
export const maskOpImpls: MaskOpImpls = {
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
};
