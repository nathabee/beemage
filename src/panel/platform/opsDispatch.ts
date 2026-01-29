// src/panel/platform/opsDispatch.ts
import { runMaskOpCore } from "./opsDispatchCore";
import { maskOpImpls } from "./opsDispatchImpl";
import type { MaskOpId, MaskOpInputs } from "./opsDispatchCore";

export async function runMaskOp(op: MaskOpId, input: MaskOpInputs): Promise<Uint8Array> {
  return runMaskOpCore(op, input, maskOpImpls);
}
