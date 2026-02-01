// src/panel/platform/opsDispatch.ts
import { runOpCore, type OpId, type OpInputsByOp, type OpOutputsByOp } from "./opsDispatchCore";
import { opImpls, OPS_IMPL_SOURCE } from "./opsDispatchImpl";
import type { MaskOpId, MaskOpInputs } from "./opsDispatchCore";
import { traceScope } from "../app/log";

export async function runOp<K extends OpId>(op: K, input: OpInputsByOp[K]): Promise<OpOutputsByOp[K]> {
  // Console-only trace (dev). This proves which opImpls module got bundled.
  traceScope("[opsDispatch] runOp", {
    op,
    implSource: OPS_IMPL_SOURCE,
    inputKeys: input && typeof input === "object" ? Object.keys(input as any) : typeof input,
  });

  return runOpCore(op, input, opImpls);
}

// Backwards-compatible wrapper for contour code
export async function runMaskOp(op: MaskOpId, input: MaskOpInputs): Promise<Uint8Array> {
  return runOp(op, input);
}
