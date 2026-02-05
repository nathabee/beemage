// src/panel/app/pipeline/outputStore.ts
import type { Artifact, ImageArtifact, MaskArtifact, SvgArtifact } from "./type";

export type PipelineLastOutput =
  | { type: "none" }
  | { type: "image"; image: ImageData }
  | { type: "mask"; mask: Uint8Array; width: number; height: number }
  | { type: "svg"; svg: string };

let last: PipelineLastOutput = { type: "none" };

export function setLastPipelineOutput(a: PipelineLastOutput): void {
  last = a;
}

export function getLastPipelineOutput(): PipelineLastOutput {
  return last;
}

// Convenience: accept your model VM shape (outputImage/outputMask/outputSvg).
export function setLastPipelineOutputFromVm(vm: any): void {
  const outSvg = vm?.outputSvg?.svg as string | undefined;
  if (typeof outSvg === "string" && outSvg.length > 0) {
    setLastPipelineOutput({ type: "svg", svg: outSvg });
    return;
  }

  const outImg = vm?.outputImage?.data as ImageData | undefined;
  if (outImg) {
    setLastPipelineOutput({ type: "image", image: outImg });
    return;
  }

  const outMask = vm?.outputMask?.data as Uint8Array | undefined;
  const w = vm?.outputMask?.width as number | undefined;
  const h = vm?.outputMask?.height as number | undefined;

  if (outMask && typeof w === "number" && typeof h === "number") {
    setLastPipelineOutput({ type: "mask", mask: outMask, width: w, height: h });
    return;
  }

  setLastPipelineOutput({ type: "none" });
}

// If you want to consume Artifact objects directly later:
export function setLastPipelineOutputFromArtifact(a: Artifact | null | undefined): void {
  if (!a) {
    setLastPipelineOutput({ type: "none" });
    return;
  }

  if (a.type === "image") {
    setLastPipelineOutput({ type: "image", image: (a as ImageArtifact).image });
    return;
  }
  if (a.type === "mask") {
    const m = a as MaskArtifact;
    setLastPipelineOutput({ type: "mask", mask: m.mask, width: m.width, height: m.height });
    return;
  }
  if (a.type === "svg") {
    setLastPipelineOutput({ type: "svg", svg: (a as SvgArtifact).svg });
    return;
  }

  setLastPipelineOutput({ type: "none" });
}
