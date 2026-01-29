import { createTuningModel } from "../../../app/tuning/model";
import { createComponentRegistry } from "../../../app/tuning/registry";
import type { ComponentId, ParamSchema, ParamValue } from "../../../app/tuning/types";

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function normalizeBySchema(schema: ParamSchema, v: ParamValue): ParamValue {
  if (schema.kind === "number") {
    const raw = Number(v);
    const def = schema.default;
    const num = Number.isFinite(raw) ? raw : def;

    const min = typeof schema.min === "number" ? schema.min : num;
    const max = typeof schema.max === "number" ? schema.max : num;

    return clampInt(num, min, max);
  }

  if (schema.kind === "boolean") return !!v;

  return String(v ?? schema.default);
}

function getParam(
  registry: ReturnType<typeof createComponentRegistry>,
  nodeId: ComponentId,
  key: string,
  effectiveValue: ParamValue,
): ParamValue {
  const node = registry.byId.get(nodeId);
  if (!node) throw new Error(`[tuningParams] unknown node: ${nodeId}`);
  const schema = node.params[key];
  if (!schema) throw new Error(`[tuningParams] unknown param: ${nodeId}.${key}`);
  return normalizeBySchema(schema, effectiveValue);
}

function findNodeById(root: any, id: ComponentId): any {
  if (root?.id === id) return root;
  for (const ch of root?.children ?? []) {
    const hit = findNodeById(ch, id);
    if (hit) return hit;
  }
  return null;
}

export type ContourTuningParams = {
  contourScale: number;
  edgeThreshold: number;
  invertOutput: boolean;

  cleanMinArea: number;
  cleanRadius: number;
  cleanBinaryThreshold: number;

  pathSmoothIters: number;
};

export async function loadContourTuningParams(): Promise<ContourTuningParams> {
  const model = createTuningModel();
  const registry = createComponentRegistry();

  const tree = await model.loadTree("app");

  const proc = findNodeById(tree.root, "contour.process");
  const clean = findNodeById(tree.root, "contour.clean");
  const vec = findNodeById(tree.root, "contour.vectorize");

  if (!proc || !clean || !vec) {
    throw new Error("[contour] tuning nodes missing (registry mismatch)");
  }

  const contourScale = getParam(registry, "contour.process", "contourScale", proc.effectiveParams.contourScale) as number;
  const edgeThreshold = getParam(registry, "contour.process", "edgeThreshold", proc.effectiveParams.edgeThreshold) as number;
  const invertOutput = getParam(registry, "contour.process", "invertOutput", proc.effectiveParams.invertOutput) as boolean;

  const cleanMinArea = getParam(registry, "contour.clean", "cleanMinArea", clean.effectiveParams.cleanMinArea) as number;
  const cleanRadius = getParam(registry, "contour.clean", "cleanRadius", clean.effectiveParams.cleanRadius) as number;
  const cleanBinaryThreshold = getParam(
    registry,
    "contour.clean",
    "cleanBinaryThreshold",
    clean.effectiveParams.cleanBinaryThreshold,
  ) as number;

  const pathSmoothIters = getParam(registry, "contour.vectorize", "pathSmoothIters", vec.effectiveParams.pathSmoothIters) as number;

  return {
    contourScale,
    edgeThreshold,
    invertOutput,
    cleanMinArea,
    cleanRadius,
    cleanBinaryThreshold,
    pathSmoothIters,
  };
}
