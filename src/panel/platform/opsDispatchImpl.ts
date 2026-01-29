// src/panel/platform/opsDispatchImpl.ts
import { logWarn } from "../app/log";
import { removeSmallComponents } from "../tabs/contour/lib/morphology";
import type { MaskOpImpls } from "./opsDispatchCore";

export const maskOpImpls: MaskOpImpls = {
  "contour.clean.removeSmallComponents": {
    native: (input, params) => {
      return removeSmallComponents(input.mask, input.width, input.height, params.cleanMinArea);
    },
    opencv: (input, params) => {
      // Extension build: force native fallback
      logWarn("OpenCV removeSmallComponents requested, falling back to native (extension build).");
      return removeSmallComponents(input.mask, input.width, input.height, params.cleanMinArea);
    },
  },
};
