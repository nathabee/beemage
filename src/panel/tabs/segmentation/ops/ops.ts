// src/panel/tabs/segmentation/ops/ops.ts
import { runOp } from "../../../platform/opsDispatch";

export type SegImageOpId = "segmentation.resize" | "segmentation.denoise" | "segmentation.color";
export type SegMaskOpId = "segmentation.threshold" | "segmentation.morphology";

export type SegImageInput =
  | { kind: "image"; image: ImageData }
  | { kind: "mat"; mat: unknown };

export type SegMaskInput =
  | { input: SegImageInput; width: number; height: number } // threshold
  | { mask: Uint8Array; width: number; height: number };    // morphology

export async function runImageOp(
  op: SegImageOpId,
  args: { input: SegImageInput; width: number; height: number },
): Promise<SegImageInput> {
  if (args.input.kind !== "image") {
    throw new Error(`[segmentation] runImageOp: Mat input not supported yet for ${op}`);
  }

  const out = await runOp(op, { image: args.input.image, width: args.width, height: args.height });
  return { kind: "image", image: out };
}

export async function runMaskOp(op: SegMaskOpId, args: SegMaskInput): Promise<Uint8Array> {
  if (op === "segmentation.threshold") {
    const { input, width, height } = args as { input: SegImageInput; width: number; height: number };
    if (input.kind !== "image") {
      throw new Error(`[segmentation] runMaskOp(threshold): Mat input not supported yet`);
    }
    return await runOp(op, { image: input.image, width, height });
  }

  // morphology
  const { mask, width, height } = args as { mask: Uint8Array; width: number; height: number };
  return await runOp(op, { mask, width, height });
}
