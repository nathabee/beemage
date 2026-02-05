// src/panel/app/pipeline/runner.ts
import { runOp } from "../../platform/opsDispatch";
import type {
  Artifact,
  ImageArtifact,
  MaskArtifact,
  SvgArtifact,
  InstalledPipeline,
  PipelineCatalogue,
  PipelineRunnerDeps,
  PipelineRunResult,
  StageRunResult,
  OpRunResult,
  OpSpec,
  OpIO,
} from "./type";

import { artifactDims } from "./type";

function isImage(a: Artifact): a is ImageArtifact {
  return a.type === "image";
}
function isMask(a: Artifact): a is MaskArtifact {
  return a.type === "mask";
}

function makeImageArtifact(img: ImageData): ImageArtifact {
  return { type: "image", width: img.width, height: img.height, image: img };
}

function makeMaskArtifact(mask: Uint8Array, width: number, height: number): MaskArtifact {
  return { type: "mask", width, height, mask };
}

function makeSvgArtifact(svg: string, width: number, height: number): SvgArtifact {
  return { type: "svg", width, height, svg };
}

function ioMismatch(expected: string, got: string): string {
  return `IO mismatch: expected ${expected}, got ${got}`;
}

function validateChainIO(stageIo: OpIO, ops: OpSpec[]): string | null {
  if (ops.length === 0) return "Stage has no installed ops";

  // First op must accept stage input
  if (ops[0]!.io.input !== stageIo.input) {
    return ioMismatch(stageIo.input, ops[0]!.io.input);
  }

  // Op-to-op chaining
  for (let i = 0; i < ops.length - 1; i++) {
    const a = ops[i]!;
    const b = ops[i + 1]!;
    if (a.io.output !== b.io.input) {
      return `Chain IO mismatch between "${a.title}" (${a.io.output}) -> "${b.title}" (${b.io.input})`;
    }
  }

  // Last op must produce stage output
  const last = ops[ops.length - 1]!;
  if (last.io.output !== stageIo.output) {
    return ioMismatch(stageIo.output, last.io.output);
  }

  return null;
}

async function execDispatchOp(
  spec: Extract<OpSpec, { kind: "dispatch" }>,
  input: Artifact,
  deps: PipelineRunnerDeps,
): Promise<Artifact> {
  // NOTE: params are resolved inside opsDispatchCore via registry + stored configs.
  // deps.getEffectiveParams is not used for dispatch ops in this architecture.

  if (spec.io.input === "image") {
    if (!isImage(input)) throw new Error(ioMismatch("image", input.type));
    const { width, height } = input;

    if (spec.io.output === "image") {
      const out = await runOp(spec.dispatchId as any, { image: input.image, width, height } as any);
      return makeImageArtifact(out as ImageData);
    }

    if (spec.io.output === "mask") {
      const out = await runOp(spec.dispatchId as any, { image: input.image, width, height } as any);
      return makeMaskArtifact(out as Uint8Array, width, height);
    }

    if (spec.io.output === "svg") {
      const out = await runOp(spec.dispatchId as any, { image: input.image, width, height } as any);
      return makeSvgArtifact(out as string, width, height);
    }

    throw new Error(`Unsupported dispatch output: ${spec.io.output}`);
  }

  // mask input
  if (!isMask(input)) throw new Error(ioMismatch("mask", input.type));
  const { width, height } = input;

  if (spec.io.output === "mask") {
    const out = await runOp(spec.dispatchId as any, { mask: input.mask, width, height } as any);
    return makeMaskArtifact(out as Uint8Array, width, height);
  }

  if (spec.io.output === "svg") {
    const out = await runOp(spec.dispatchId as any, { mask: input.mask, width, height } as any);
    return makeSvgArtifact(out as string, width, height);
  }

  throw new Error(`Invalid op spec: mask input cannot produce ${spec.io.output} (not supported here)`);
}


async function execOp(spec: OpSpec, input: Artifact, deps: PipelineRunnerDeps): Promise<Artifact> {
  if (spec.kind === "dispatch") {
    return await execDispatchOp(spec, input, deps);
  }

  // JS ops still use deps.getEffectiveParams (because they have no dispatcher-resolved params)
  const params = spec.tuningId ? await deps.getEffectiveParams(spec.tuningId).catch(() => ({})) : {};
  const out = await spec.run({ input, params });
  return out;
}

 

/**
 * Executes an InstalledPipeline using the catalogue for:
 * - topology and stage contracts
 * - allowed ops
 * - op definitions (dispatch ids)
 */
export async function runInstalledPipeline(args: {
  catalogue: PipelineCatalogue;
  installed: InstalledPipeline;
  inputImage: ImageData;
  deps: PipelineRunnerDeps;
}): Promise<PipelineRunResult> {
  const { catalogue, installed, inputImage, deps } = args;

  const spec = catalogue.getPipeline(installed.pipelineId);
  if (!spec) {
    return {
      pipelineId: installed.pipelineId,
      title: installed.pipelineId,
      status: "error",
      error: `Unknown pipelineId: ${installed.pipelineId}`,
      input: makeImageArtifact(inputImage),
      stages: [],
    };
  }

  if (!spec.implemented) {
    return {
      pipelineId: spec.id,
      title: spec.title,
      status: "error",
      error: "Not implemented yet",
      input: makeImageArtifact(inputImage),
      stages: [],
    };
  }

  // Build a stage map from installed config for quick lookup
  const installedByStage = new Map<string, { stageId: string; ops: { instanceId: string; opId: string }[] }>();
  for (const st of installed.stages) installedByStage.set(st.stageId, st);

  const stagesOut: StageRunResult[] = [];
  let current: Artifact = makeImageArtifact(inputImage);

  for (const stage of spec.stages) {
    const installedStage = installedByStage.get(stage.id);

    // If user didn't configure this stage, use defaults from spec
    const opInstances = installedStage?.ops?.length
      ? installedStage.ops
      : (stage.defaultOps ?? []).map((opId, i) => ({ instanceId: `${stage.id}.${i + 1}`, opId }));

    const resolvedOps: OpSpec[] = [];
    const opRuns: OpRunResult[] = [];

    // Resolve + validate allowed ops
    let stageError: string | null = null;

    for (const inst of opInstances) {
      const opSpec = catalogue.getOp(inst.opId);
      if (!opSpec) {
        stageError = `Unknown opId: ${inst.opId}`;
        break;
      }
      if (!stage.allowedOps.includes(opSpec.id)) {
        stageError = `Op not allowed in this stage: ${opSpec.title} (${opSpec.id})`;
        break;
      }
      resolvedOps.push(opSpec);
    }

    if (!stageError) {
      const chainErr = validateChainIO(stage.io, resolvedOps);
      if (chainErr) stageError = chainErr;
    }

    if (stageError) {
      const sres: StageRunResult = {
        stageId: stage.id,
        title: stage.title,
        io: stage.io,
        status: "error",
        error: stageError,
        ops: opInstances.map((inst) => ({
          instanceId: inst.instanceId,
          opId: inst.opId,
          title: inst.opId,
          io: { input: stage.io.input, output: stage.io.output },
          status: "error",
          error: stageError,
        })),
      };
      stagesOut.push(sres);

      deps.debug("pipeline stage failed (validation)", {
        pipelineId: spec.id,
        stageId: stage.id,
        error: stageError,
      });

      return {
        pipelineId: spec.id,
        title: spec.title,
        status: "error",
        error: `Stage "${stage.title}" failed: ${stageError}`,
        input: makeImageArtifact(inputImage),
        stages: stagesOut,
      };
    }

    // Execute the stage op chain
    let stageArtifact: Artifact = current;
    let stageOk = true;
    let stageErrMsg: string | undefined;

    for (let i = 0; i < resolvedOps.length; i++) {
      const inst = opInstances[i]!;
      const opSpec = resolvedOps[i]!;

      try {
        // Enforce runtime IO
        if (opSpec.io.input !== stageArtifact.type) {
          throw new Error(ioMismatch(opSpec.io.input, stageArtifact.type));
        }

        const out = await execOp(opSpec, stageArtifact, deps);

        // Enforce declared output
        if (out.type !== opSpec.io.output) {
          throw new Error(ioMismatch(opSpec.io.output, out.type));
        }

        opRuns.push({
          instanceId: inst.instanceId,
          opId: opSpec.id,
          title: opSpec.title,
          io: opSpec.io,
          status: "ok",
          output: out,
        });

        stageArtifact = out;
      } catch (e) {
        stageOk = false;
        stageErrMsg = e instanceof Error ? e.message : String(e);

        opRuns.push({
          instanceId: inst.instanceId,
          opId: opSpec.id,
          title: opSpec.title,
          io: opSpec.io,
          status: "error",
          error: stageErrMsg,
        });

        deps.debug("pipeline op failed", {
          pipelineId: spec.id,
          stageId: stage.id,
          opId: opSpec.id,
          error: stageErrMsg,
          ...artifactDims(stageArtifact),
        });
        break;
      }
    }

    const stageResult: StageRunResult = {
      stageId: stage.id,
      title: stage.title,
      io: stage.io,
      status: stageOk ? "ok" : "error",
      error: stageOk ? undefined : stageErrMsg,
      ops: opRuns,
      output: stageOk ? stageArtifact : undefined,
    };

    stagesOut.push(stageResult);

    if (!stageOk) {
      return {
        pipelineId: spec.id,
        title: spec.title,
        status: "error",
        error: `Stage "${stage.title}" failed: ${stageErrMsg ?? "unknown error"}`,
        input: makeImageArtifact(inputImage),
        stages: stagesOut,
      };
    }

    // Stage succeeded; advance artifact
    current = stageArtifact;
  }

  return {
    pipelineId: spec.id,
    title: spec.title,
    status: "ok",
    input: makeImageArtifact(inputImage),
    output: current,
    stages: stagesOut,
  };
}
