// src/panel/platform/opsDispatchCore.ts
import { resolveComponent } from "../app/tuning/resolve";
import { createComponentRegistry } from "../app/tuning/registry";
import { loadComponentConfigs } from "../app/tuning/store";
import { isOpenCvInjected } from "../app/engine/engineAvailability";
import { logWarn } from "../app/log";

export type EngineId = "native" | "opencv";

// -----------------------------
// Universal op typing
// -----------------------------
export type MaskOpInputs = {
  mask: Uint8Array;
  width: number;
  height: number;
};

export type ImageOpInputs = {
  image: ImageData;
  width: number;
  height: number;
};

// -----------------------------
// Dispatch op ids (must match opImpls keys and pipeline dispatchId)
// -----------------------------
export type OpId =
  | "contour.clean.removeSmallComponents"
  | "segmentation.resize"
  | "segmentation.denoise"
  | "segmentation.color"
  | "segmentation.threshold"
  | "segmentation.morphology"
  | "edge.resize"
  | "edge.threshold"
  | "edge.morphology"
  | "edge.extract"
  | "svg.create";
;

export type OpInputsByOp = {
  "contour.clean.removeSmallComponents": MaskOpInputs;

  "segmentation.resize": ImageOpInputs;
  "segmentation.denoise": ImageOpInputs;
  "segmentation.color": ImageOpInputs;
  "segmentation.threshold": ImageOpInputs;
  "segmentation.morphology": MaskOpInputs;

  "edge.resize": ImageOpInputs;
  "edge.threshold": ImageOpInputs;
  "edge.morphology": MaskOpInputs;
  "edge.extract": MaskOpInputs;
  "svg.create": MaskOpInputs;

};

export type OpOutputsByOp = {
  "contour.clean.removeSmallComponents": Uint8Array;

  "segmentation.resize": ImageData;
  "segmentation.denoise": ImageData;
  "segmentation.color": ImageData;
  "segmentation.threshold": Uint8Array;
  "segmentation.morphology": Uint8Array;

  "edge.resize": ImageData;
  "edge.threshold": Uint8Array;
  "edge.morphology": Uint8Array;
  "edge.extract": Uint8Array;
  "svg.create": string;

};

export type OpParamsByOp = {
  "contour.clean.removeSmallComponents": {
    cleanMinArea: number;
  };

  "segmentation.resize": { resizeAlgo: number; targetMaxW: number };
  "segmentation.denoise": { denoiseAlgo: number; blurK: number; bilateralSigma: number };
  "segmentation.color": { colorMode: number; hsvChannel: number };
  "segmentation.threshold": { thresholdAlgo: number; manualT: number; adaptBlock: number; adaptC: number };
  "segmentation.morphology": { morphAlgo: number; morphK: number; morphIters: number };

  "edge.resize": { resizeAlgo: number; targetMaxW: number };
  "edge.threshold": { manualT: number };
  "edge.morphology": { morphAlgo: number; morphK: number; morphIters: number };
  "edge.extract": {};
  "svg.create": { scale: number; transparentBg: number; color: string };

};

export type OpImpls = {
  [K in OpId]: {
    native: (input: OpInputsByOp[K], params: OpParamsByOp[K]) => OpOutputsByOp[K] | Promise<OpOutputsByOp[K]>;
    opencv: (input: OpInputsByOp[K], params: OpParamsByOp[K]) => OpOutputsByOp[K] | Promise<OpOutputsByOp[K]>;
  };
};

// -----------------------------
// Back-compat alias (contour code unchanged)
// -----------------------------
export type MaskOpId = "contour.clean.removeSmallComponents";

const registry = createComponentRegistry();

function getRuntime() {
  return { opencvReady: isOpenCvInjected() };
}

async function resolveEngineAndParams<K extends OpId>(op: K): Promise<{
  engine: EngineId;
  params: OpParamsByOp[K];
  fallbackReason?: string;
  opencvReady: boolean;
}> {
  const stored = await loadComponentConfigs();
  const runtime = getRuntime();

  const resolved = resolveComponent(op, registry, stored, runtime);

  if (op === "contour.clean.removeSmallComponents") {
    const cleanMinArea = Number((resolved.params as any).cleanMinArea ?? 12);
    return {
      engine: resolved.engine,
      params: { cleanMinArea } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  // -----------------------------
  // Segmentation params
  // -----------------------------
  if (op === "segmentation.resize") {
    const resizeAlgo = Number((resolved.params as any).resizeAlgo ?? 1);
    const targetMaxW = Number((resolved.params as any).targetMaxW ?? 900);
    return {
      engine: resolved.engine,
      params: { resizeAlgo, targetMaxW } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  if (op === "segmentation.denoise") {
    const denoiseAlgo = Number((resolved.params as any).denoiseAlgo ?? 1);
    const blurK = Number((resolved.params as any).blurK ?? 5);
    const bilateralSigma = Number((resolved.params as any).bilateralSigma ?? 35);
    return {
      engine: resolved.engine,
      params: { denoiseAlgo, blurK, bilateralSigma } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  if (op === "segmentation.color") {
    const colorMode = Number((resolved.params as any).colorMode ?? 1);
    const hsvChannel = Number((resolved.params as any).hsvChannel ?? 2);
    return {
      engine: resolved.engine,
      params: { colorMode, hsvChannel } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  if (op === "segmentation.threshold") {
    const thresholdAlgo = Number((resolved.params as any).thresholdAlgo ?? 1);
    const manualT = Number((resolved.params as any).manualT ?? 128);
    const adaptBlock = Number((resolved.params as any).adaptBlock ?? 21);
    const adaptC = Number((resolved.params as any).adaptC ?? 2);
    return {
      engine: resolved.engine,
      params: { thresholdAlgo, manualT, adaptBlock, adaptC } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  if (op === "segmentation.morphology") {
    const morphAlgo = Number((resolved.params as any).morphAlgo ?? 2);
    const morphK = Number((resolved.params as any).morphK ?? 7);
    const morphIters = Number((resolved.params as any).morphIters ?? 1);
    return {
      engine: resolved.engine,
      params: { morphAlgo, morphK, morphIters } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  // -----------------------------
  // Edge params
  // -----------------------------
  if (op === "edge.resize") {
    const resizeAlgo = Number((resolved.params as any).resizeAlgo ?? 1);
    const targetMaxW = Number((resolved.params as any).targetMaxW ?? 1200);
    return {
      engine: resolved.engine,
      params: { resizeAlgo, targetMaxW } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  if (op === "edge.threshold") {
    const manualT = Number((resolved.params as any).manualT ?? 128);
    return {
      engine: resolved.engine,
      params: { manualT } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  if (op === "edge.morphology") {
    const morphAlgo = Number((resolved.params as any).morphAlgo ?? 2);
    const morphK = Number((resolved.params as any).morphK ?? 3);
    const morphIters = Number((resolved.params as any).morphIters ?? 1);
    return {
      engine: resolved.engine,
      params: { morphAlgo, morphK, morphIters } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  if (op === "edge.extract") {
    return {
      engine: resolved.engine,
      params: {} as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  if (op === "svg.create") {
    const scale = Number((resolved.params as any).scale ?? 1);
    const transparentBg = Number((resolved.params as any).transparentBg ?? 1); // 1=true default
    const color = String((resolved.params as any).color ?? "#000");
    return {
      engine: resolved.engine,
      params: { scale, transparentBg, color } as OpParamsByOp[K],
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }


  throw new Error(`[opsDispatch] Unknown op: ${op}`);
}

export async function runOpCore<K extends OpId>(
  op: K,
  input: OpInputsByOp[K],
  impls: OpImpls,
): Promise<OpOutputsByOp[K]> {
  const { engine, params, fallbackReason, opencvReady } = await resolveEngineAndParams(op);

  if (engine === "opencv" && !opencvReady) {
    logWarn(`OpenCV selected for ${op} but not ready; falling back to native. ${fallbackReason ?? ""}`.trim());
    return await impls[op].native(input as any, params as any);
  }

  return await impls[op][engine](input as any, params as any);
}
