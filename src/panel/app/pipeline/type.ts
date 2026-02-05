// src/panel/app/pipeline/type.ts
import type { ParamValue } from "../tuning/types";

export type PipelineId = string;
export type StageId = string;
export type OpId = string;
export type OpInstanceId = string;

export type ArtifactType = "image" | "mask" | "svg";

export type ImageArtifact = {
  type: "image";
  width: number;
  height: number;
  image: ImageData;
};

export type MaskArtifact = {
  type: "mask";
  width: number;
  height: number;
  // 0..255 per pixel (single channel)
  mask: Uint8Array;
};

export type SvgArtifact = {
  type: "svg";
  width: number;
  height: number;
  // Full SVG markup (including <svg ...> root)
  svg: string;
};

export type Artifact = ImageArtifact | MaskArtifact | SvgArtifact;

export type OpIO = {
  input: ArtifactType;
  output: ArtifactType;
};

export type StageSpec = {
  id: StageId;
  title: string;
  description?: string;

  io: OpIO;

  /**
   * Which operations are allowed to be installed in this stage.
   * UI can use this to filter draggable cards.
   */
  allowedOps: ReadonlyArray<OpId>;

  /**
   * Default installed ops for this stage (when creating a new pipeline instance).
   * Can be empty, but most stages should have at least one default op.
   */
  defaultOps: ReadonlyArray<OpId>;
};

export type PipelineSpec = {
  id: PipelineId;
  title: string;
  description?: string;

  /**
   * If false, runner should refuse to execute (but UI can still display it).
   */
  implemented: boolean;

  stages: ReadonlyArray<StageSpec>;
};

export type InstalledOp = {
  instanceId: OpInstanceId;
  opId: OpId;
};

export type InstalledStage = {
  stageId: StageId;
  ops: InstalledOp[]; // multiple ops per stage, sequential
};

export type InstalledPipeline = {
  pipelineId: PipelineId;
  stages: InstalledStage[];
};

export type DispatchOpSpec = {
  kind: "dispatch";
  id: OpId;
  title: string;
  description?: string;

  /**
   * IO contract for this op.
   * The runner enforces compatibility.
   */
  io: OpIO;

  /**
   * The id used by opsDispatch (e.g. "segmentation.resize").
   * This is what ultimately gets executed.
   */
  dispatchId: string;

  /**
   * Tuning component id used for param lookup. Often same as dispatchId.
   * Example: dispatchId="segmentation.resize", tuningId="segmentation.resize"
   */
  tuningId: string;
};

export type JsOpSpec = {
  kind: "js";
  id: OpId;
  title: string;
  description?: string;

  io: OpIO;

  /**
   * Optional tuning id for param lookup.
   * If omitted, params will be {}.
   */
  tuningId?: string;

  run: (args: {
    input: Artifact;
    params: Record<string, ParamValue>;
  }) => Promise<Artifact> | Artifact;
};

export type OpSpec = DispatchOpSpec | JsOpSpec;

export type PipelineCatalogue = {
  pipelines: ReadonlyArray<PipelineSpec>;
  ops: ReadonlyArray<OpSpec>;

  getPipeline(id: PipelineId): PipelineSpec | null;
  getOp(id: OpId): OpSpec | null;

  /**
   * Creates a runnable InstalledPipeline using defaults from the PipelineSpec.
   * Stages are emitted in spec order.
   */
  makeDefaultInstalled(pipelineId: PipelineId): InstalledPipeline | null;
};

export type RunStepStatus = "ok" | "error";

export type OpRunResult = {
  instanceId: OpInstanceId;
  opId: OpId;
  title: string;

  io: OpIO;

  status: RunStepStatus;
  error?: string;

  output?: Artifact;
};

export type StageRunResult = {
  stageId: StageId;
  title: string;
  io: OpIO;

  status: RunStepStatus;
  error?: string;

  ops: OpRunResult[];

  /**
   * Output after the full stage chain.
   * Present only if stage status is ok.
   */
  output?: Artifact;
};

export type PipelineRunResult = {
  pipelineId: PipelineId;
  title: string;

  status: RunStepStatus;
  error?: string;

  input: Artifact;
  output?: Artifact;

  stages: StageRunResult[];
};

export type PipelineRunnerDeps = {
  /**
   * Resolve effective params for a tuning node (defaults + overrides + inheritance).
   * If you don't care yet, implement as: async () => ({})
   */
  getEffectiveParams: (tuningId: string) => Promise<Record<string, ParamValue>>;

  /**
   * Persisted debug channel (wire to debugTrace.append in caller).
   */
  debug: (message: string, meta?: Record<string, unknown>) => void;
};

export function makeInstanceId(prefix: string, i: number): OpInstanceId {
  return `${prefix}.${i + 1}`;
}

export function artifactDims(a: Artifact): { width: number; height: number } {
  return { width: a.width, height: a.height };
}
