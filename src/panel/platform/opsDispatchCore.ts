// src/panel/platform/opsDispatchCore.ts
import { resolveComponent } from "../app/tuning/resolve";
import { createComponentRegistry } from "../app/tuning/registry";
import { loadComponentConfigs } from "../app/tuning/store";
import { isOpenCvInjected } from "../app/engine/engineAvailability";
import { logWarn } from "../app/log";

export type MaskOpId = "contour.clean.removeSmallComponents";

export type MaskOpInputs = {
  mask: Uint8Array;
  width: number;
  height: number;
};

export type MaskOpParamsByOp = {
  "contour.clean.removeSmallComponents": {
    cleanMinArea: number;
  };
};

export type EngineId = "native" | "opencv";

export type MaskOpImpls = {
  [K in MaskOpId]: {
    native: (input: MaskOpInputs, params: MaskOpParamsByOp[K]) => Uint8Array | Promise<Uint8Array>;
    opencv: (input: MaskOpInputs, params: MaskOpParamsByOp[K]) => Uint8Array | Promise<Uint8Array>;
  };
};

const registry = createComponentRegistry();

function getRuntime() {
  return { opencvReady: isOpenCvInjected() };
}

async function resolveEngineAndParams(op: MaskOpId): Promise<{
  engine: EngineId;
  params: MaskOpParamsByOp[typeof op];
  fallbackReason?: string;
  opencvReady: boolean;
}> {
  const stored = await loadComponentConfigs();
  const runtime = getRuntime();

  const resolved = resolveComponent(op, registry, stored, runtime);

  // Typed param mapping (keeps callers clean, keeps clamping rules centralized later)
  if (op === "contour.clean.removeSmallComponents") {
    const cleanMinArea = Number(resolved.params.cleanMinArea ?? 12);

    return {
      engine: resolved.engine,
      params: { cleanMinArea },
      fallbackReason: resolved.fallbackReason,
      opencvReady: !!runtime.opencvReady,
    };
  }

  // unreachable, but TS likes completeness
  throw new Error(`[opsDispatch] Unknown op: ${op}`);
}

export async function runMaskOpCore(op: MaskOpId, input: MaskOpInputs, impls: MaskOpImpls): Promise<Uint8Array> {
  const { engine, params, fallbackReason, opencvReady } = await resolveEngineAndParams(op);

  if (engine === "opencv" && !opencvReady) {
    logWarn(`OpenCV selected for ${op} but not ready; falling back to native. ${fallbackReason ?? ""}`.trim());
    return await impls[op].native(input, params as any);
  }

  // If platform's opencv impl is just a stub, it can internally fallback or warn.
  return await impls[op][engine](input, params as any);
}
