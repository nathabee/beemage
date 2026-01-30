// src/panel/tabs/segmentation/ops/segmentation.ts
import { runImageOp, runMaskOp, type SegImageInput } from "./ops";

export type SegCtx = {
  width: number;
  height: number;
};

export type SegStepInput = SegImageInput;

export type SegStepOutput =
  | SegImageInput
  | { kind: "mask"; mask: Uint8Array; width: number; height: number };

export async function runSegmentationPipeline(
  ctx: SegCtx,
  input: SegStepInput,
): Promise<SegStepOutput> {
  // Step 1: Resize
  const resized = await runImageOp("segmentation.resize", {
    input,
    width: ctx.width,
    height: ctx.height,
  });

  // Step 2: Denoise
  const denoised = await runImageOp("segmentation.denoise", {
    input: resized,
    width: ctx.width,
    height: ctx.height,
  });

  // Step 3: Color/Gray
  const featured = await runImageOp("segmentation.color", {
    input: denoised,
    width: ctx.width,
    height: ctx.height,
  });

  // Step 4: Threshold -> mask
  const mask = await runMaskOp("segmentation.threshold", {
    input: featured,
    width: ctx.width,
    height: ctx.height,
  });

  // Step 5: Morph cleanup (mask -> mask)
  const cleanMask = await runMaskOp("segmentation.morphology", {
    mask,
    width: ctx.width,
    height: ctx.height,
  });

  return { kind: "mask", mask: cleanMask, width: ctx.width, height: ctx.height };
}
