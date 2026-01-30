// src/panel/platform/opsDispatch.ts
import { runOpCore, type OpId, type OpInputsByOp, type OpOutputsByOp } from "./opsDispatchCore";
import { opImpls } from "./opsDispatchImpl";
import type { MaskOpId, MaskOpInputs } from "./opsDispatchCore";

export async function runOp<K extends OpId>(op: K, input: OpInputsByOp[K]): Promise<OpOutputsByOp[K]> {
  return runOpCore(op, input, opImpls);
}

// Backwards-compatible wrapper for contour code
export async function runMaskOp(op: MaskOpId, input: MaskOpInputs): Promise<Uint8Array> {
  return runOp(op, input);
}
