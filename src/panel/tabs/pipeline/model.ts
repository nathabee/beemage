// src/panel/tabs/pipeline/model.ts
import { createPipelineCatalogue } from "../../app/pipeline/catalogue";
import { runInstalledPipeline } from "../../app/pipeline/runner";
import { runOp } from "../../platform/opsDispatch";


import type {
  Artifact,
  ArtifactType,
  InstalledPipeline,
  OpId,
  PipelineId,
  PipelineRunnerDeps,
  PipelineRunResult,
  PipelineSpec,
  StageId,
} from "../../app/pipeline/type";

export type RunState = "idle" | "ok" | "error";

export type PipelineRecipeId = string;



export type OpVm = {
  instanceId: string;
  opId: OpId;
  title: string;
  input: ArtifactType;
  output: ArtifactType;
  state: RunState;
  error?: string;
  outputArtifact?: Artifact;
};

export type StageVm = {
  stageId: StageId;
  title: string;
  input: ArtifactType;
  output: ArtifactType;
  ops: OpVm[];
  state: RunState;
  error?: string;
  outputArtifact?: Artifact;
};


export type PipelineVm = {
  pipelines: Array<{ id: PipelineId; title: string }>;
  recipes: Array<{ id: PipelineRecipeId; title: string }>;

  activePipelineId: PipelineId;
  activeRecipeId: PipelineRecipeId;

  statusText: string;

  stages: StageVm[];

  input?: { width: number; height: number; data: ImageData };

  outputImage?: { width: number; height: number; data: ImageData };
  outputMask?: { width: number; height: number; data: Uint8Array };
  outputSvg?: { width: number; height: number; svg: string };

  nextIndex: number;
  totalOps: number;
};


export type PipelineModel = {
  getVm(): PipelineVm;

  setActivePipeline(id: PipelineId): void;
  setActiveRecipe(id: PipelineRecipeId): void;

  setInputImageData(img: ImageData): void;

  // Stage/ops editing hooks (for drag/drop later)
  getInstalled(): InstalledPipeline;
  setStageOps(stageId: StageId, opIds: OpId[]): void;

  runAll(): Promise<void>;
  runNext(): Promise<void>;
  reset(): void;
};

export type PipelineModelDeps = {
  runner: PipelineRunnerDeps;
};

type RecipeDef = {
  id: PipelineRecipeId;
  title: string;
  buildInstalled: (spec: PipelineSpec) => InstalledPipeline;
};

type OpPlanItem = {
  stageId: StageId;
  stageTitle: string;
  stageInput: ArtifactType;
  stageOutput: ArtifactType;

  instanceId: string;
  opId: OpId;
  opTitle: string;
  opInput: ArtifactType;
  opOutput: ArtifactType;

  // execution descriptor
  kind: "dispatch" | "js";
  dispatchId?: string;
  tuningId?: string;
  runJs?: (args: { input: Artifact; params: Record<string, any> }) => Promise<Artifact> | Artifact;
};

export function createPipelineModel(deps: PipelineModelDeps): PipelineModel {
  const catalogue = createPipelineCatalogue();

  let activePipelineId: PipelineId = catalogue.pipelines[0]?.id ?? "segmentation";
  let activeRecipeId: PipelineRecipeId = "default";

  let installed: InstalledPipeline | null = null;

  let input: ImageData | null = null;
  let statusText = "Idle";

  let plan: OpPlanItem[] = [];
  let nextIndex = 0;
  let currentArtifact: Artifact | null = null;

  let opState: Record<string, RunState> = {};
  let stageState: Record<string, RunState> = {};

  let lastOutput: Artifact | null = null;

  let opOutput: Record<string, Artifact> = {};
  let stageOutput: Record<string, Artifact> = {};
  let opError: Record<string, string> = {};
  let stageError: Record<string, string> = {};


  function getSpec(): PipelineSpec {
    return catalogue.getPipeline(activePipelineId) ?? catalogue.pipelines[0]!;
  }

  function makeRecipesForPipeline(spec: PipelineSpec): RecipeDef[] {
    const defDefault: RecipeDef = {
      id: "default",
      title: "Default",
      buildInstalled: () => {
        const x = catalogue.makeDefaultInstalled(spec.id);
        if (!x) throw new Error(`Cannot build default installed for pipeline: ${spec.id}`);
        return x;
      },
    };

    if (spec.id === "segmentation") {
      const stageIds = spec.stages.map((s) => s.id);

      const fast: RecipeDef = {
        id: "fast",
        title: "Fast (minimal)",
        buildInstalled: () => ({
          pipelineId: spec.id,
          stages: stageIds.map((sid) => {
            if (sid.endsWith("prep")) return { stageId: sid, ops: [{ instanceId: `${sid}.1`, opId: "op.seg.resize" }] };
            if (sid.endsWith("binarize")) return { stageId: sid, ops: [{ instanceId: `${sid}.1`, opId: "op.seg.threshold" }] };
            if (sid.endsWith("cleanup")) return { stageId: sid, ops: [{ instanceId: `${sid}.1`, opId: "op.seg.morphology" }] };
            return { stageId: sid, ops: [{ instanceId: `${sid}.1`, opId: "op.util.pass" }] };
          }),
        }),
      };

      const strong: RecipeDef = {
        id: "strong",
        title: "Strong cleanup (double morphology)",
        buildInstalled: () => ({
          pipelineId: spec.id,
          stages: stageIds.map((sid) => {
            if (sid.endsWith("cleanup")) {
              return {
                stageId: sid,
                ops: [
                  { instanceId: `${sid}.1`, opId: "op.seg.morphology" },
                  { instanceId: `${sid}.2`, opId: "op.seg.morphology" },
                ],
              };
            }
            const defaults = spec.stages.find((s) => s.id === sid)?.defaultOps ?? [];
            return {
              stageId: sid,
              ops: defaults.map((opId, i) => ({ instanceId: `${sid}.${i + 1}`, opId })),
            };
          }),
        }),
      };

      return [defDefault, fast, strong];
    }

    return [defDefault];
  }

  function rebuildInstalled(): void {
    const spec = getSpec();
    const recipes = makeRecipesForPipeline(spec);

    const r = recipes.find((x) => x.id === activeRecipeId) ?? recipes[0]!;
    activeRecipeId = r.id;

    installed = r.buildInstalled(spec);
  }

  function resetRunState(): void {
    opState = {};
    stageState = {};
    opError = {};
    stageError = {};

    plan = [];
    nextIndex = 0;
    currentArtifact = null;
    lastOutput = null;

    opOutput = {};
    stageOutput = {};

    const spec = getSpec();
    statusText = spec.implemented ? "Ready" : "Not implemented yet";
  }


  function reset(): void {
    rebuildInstalled();
    resetRunState();
  }

  function setActivePipeline(id: PipelineId): void {
    if (id === activePipelineId) return;
    if (!catalogue.getPipeline(id)) return;

    activePipelineId = id;
    activeRecipeId = "default";
    reset();
  }

  function setActiveRecipe(id: PipelineRecipeId): void {
    if (id === activeRecipeId) return;
    activeRecipeId = id;
    reset();
  }

  function setInputImageData(img: ImageData): void {
    input = img;
    resetRunState();
  }

  function getInstalled(): InstalledPipeline {
    if (!installed) rebuildInstalled();
    return installed!;
  }

  function setStageOps(stageId: StageId, opIds: OpId[]): void {
    const spec = getSpec();
    const stageSpec = spec.stages.find((s) => s.id === stageId);
    if (!stageSpec) return;

    const filtered = opIds.filter((opId) => stageSpec.allowedOps.includes(opId));
    const nextStages = getInstalled().stages.map((st) => {
      if (st.stageId !== stageId) return st;
      return {
        stageId,
        ops: filtered.map((opId, i) => ({ instanceId: `${stageId}.${i + 1}`, opId })),
      };
    });

    installed = { pipelineId: spec.id, stages: nextStages };
    resetRunState();
  }

  function buildPlanFromInstalled(): void {
    const spec = getSpec();
    const inst = getInstalled();

    const stageSpecById = new Map(spec.stages.map((s) => [s.id, s]));
    const opSpecById = new Map(catalogue.ops.map((o) => [o.id, o]));

    const out: OpPlanItem[] = [];

    for (const st of inst.stages) {
      const stSpec = stageSpecById.get(st.stageId);
      if (!stSpec) continue;

      for (const opInst of st.ops) {
        const opSpec = opSpecById.get(opInst.opId);
        if (!opSpec) continue;

        if (opSpec.kind === "dispatch") {
          out.push({
            stageId: st.stageId,
            stageTitle: stSpec.title,
            stageInput: stSpec.io.input,
            stageOutput: stSpec.io.output,
            instanceId: opInst.instanceId,
            opId: opSpec.id,
            opTitle: opSpec.title,
            opInput: opSpec.io.input,
            opOutput: opSpec.io.output,
            kind: "dispatch",
            dispatchId: opSpec.dispatchId,
            tuningId: opSpec.tuningId,
          });
        } else {
          out.push({
            stageId: st.stageId,
            stageTitle: stSpec.title,
            stageInput: stSpec.io.input,
            stageOutput: stSpec.io.output,
            instanceId: opInst.instanceId,
            opId: opSpec.id,
            opTitle: opSpec.title,
            opInput: opSpec.io.input,
            opOutput: opSpec.io.output,
            kind: "js",
            tuningId: opSpec.tuningId,
            runJs: opSpec.run,
          });
        }
      }
    }

    plan = out;
  }


  function pickLastAvailableOutput(result: PipelineRunResult): Artifact | null {
    if (result.output) return result.output;

    for (let i = result.stages.length - 1; i >= 0; i--) {
      const st = result.stages[i];
      if (st.output) return st.output;

      for (let j = st.ops.length - 1; j >= 0; j--) {
        const op = st.ops[j];
        if (op.output) return op.output;
      }
    }

    return null;
  }


  function applyRunResultToCaches(result: PipelineRunResult): void {
    opState = {};
    stageState = {};
    opError = {};
    stageError = {};
    opOutput = {};
    stageOutput = {};

    for (const st of result.stages) {
      stageState[st.stageId] = st.status === "ok" ? "ok" : "error";
      if (st.error) stageError[st.stageId] = st.error;
      if (st.output) stageOutput[st.stageId] = st.output;

      for (const op of st.ops) {
        opState[op.instanceId] = op.status === "ok" ? "ok" : "error";
        if (op.error) opError[op.instanceId] = op.error;
        if (op.output) opOutput[op.instanceId] = op.output;
      }
    }

    lastOutput = pickLastAvailableOutput(result);

    // If runner claims OK but gives no output, that’s a real bug; make it explicit.
    if (result.status === "ok" && !lastOutput) {
      deps.runner.debug("pipeline ok but no output artifact", {
        pipelineId: result.pipelineId,
        stages: result.stages.length,
      });
      statusText = "Done (but no output artifact)";
      return;
    }

    statusText = result.status === "ok" ? "Done" : result.error ?? "Error";
  }



  async function runAll(): Promise<void> {
    const spec = getSpec();
    if (!spec.implemented) {
      statusText = "Not implemented yet";
      return;
    }

    if (!input) {
      statusText = "No input image";
      return;
    }

    statusText = "Running all…";
    opState = {};
    stageState = {};
    opOutput = {};
    stageOutput = {};
    nextIndex = 0;

    const result = await runInstalledPipeline({
      catalogue,
      installed: getInstalled(),
      inputImage: input,
      deps: deps.runner,
    });

    applyRunResultToCaches(result);

    buildPlanFromInstalled();
    nextIndex = plan.length;
  }

  async function runNext(): Promise<void> {
    const spec = getSpec();
    if (!spec.implemented) {
      statusText = "Not implemented yet";
      return;
    }
    if (!input) {
      statusText = "No input image";
      return;
    }

    if (plan.length === 0) buildPlanFromInstalled();

    if (plan.length === 0) {
      statusText = "No ops installed";
      return;
    }

    if (!currentArtifact) {
      currentArtifact = { type: "image", width: input.width, height: input.height, image: input };
      lastOutput = null;

      opState = {};
      stageState = {};
      opOutput = {};
      stageOutput = {};

      nextIndex = 0;
    }

    if (nextIndex >= plan.length) {
      statusText = "Done";
      return;
    }

    const step = plan[nextIndex]!;
    try {
      statusText = `Running: ${step.stageTitle} → ${step.opTitle}`;

      if (currentArtifact.type !== step.opInput) {
        throw new Error(`IO mismatch: expected ${step.opInput}, got ${currentArtifact.type}`);
      }

      const params =
        step.tuningId ? await deps.runner.getEffectiveParams(step.tuningId).catch(() => ({})) : {};

      let out: Artifact;

      if (step.kind === "dispatch") {
        const width = currentArtifact.width;
        const height = currentArtifact.height;

        if (currentArtifact.type === "image") {
          const img = currentArtifact.image;

          const raw = await runOp(step.dispatchId as any, {
            image: img,
            width,
            height,
            params,
          } as any);

          if (step.opOutput === "image") {
            const outImg = raw as ImageData;
            out = { type: "image", width: outImg.width, height: outImg.height, image: outImg };
          } else if (step.opOutput === "mask") {
            out = { type: "mask", width, height, mask: raw as Uint8Array };
          } else if (step.opOutput === "svg") {
            out = { type: "svg", width, height, svg: raw as string };
          } else {
            throw new Error(`Unsupported op output kind: ${step.opOutput}`);
          }
        } else if (currentArtifact.type === "mask") {
          const raw = await runOp(step.dispatchId as any, {
            mask: currentArtifact.mask,
            width,
            height,
            params,
          } as any);

          if (step.opOutput === "mask") {
            out = { type: "mask", width, height, mask: raw as Uint8Array };
          } else if (step.opOutput === "svg") {
            out = { type: "svg", width, height, svg: raw as string };
          } else {
            throw new Error(`IO mismatch: mask input cannot produce ${step.opOutput} (yet)`);
          }
        } else {
          // currentArtifact.type === "svg"
          throw new Error(`Dispatch op cannot run on svg input (opInput=${step.opInput})`);
        }
      } else {
        if (!step.runJs) throw new Error("Missing js op implementation");
        out = await step.runJs({ input: currentArtifact, params });
      }

      if (out.type !== step.opOutput) {
        throw new Error(`IO mismatch: expected ${step.opOutput}, got ${out.type}`);
      }

      opState[step.instanceId] = "ok";
      stageState[step.stageId] = "ok";

      opOutput[step.instanceId] = out;
      stageOutput[step.stageId] = out;

      currentArtifact = out;
      lastOutput = out;

      nextIndex += 1;
      statusText = nextIndex >= plan.length ? "Done" : "Ready";
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      opState[step.instanceId] = "error";
      stageState[step.stageId] = "error";
      stageError[step.stageId] = msg;
      opError[step.instanceId] = msg;
      statusText = `Error: ${step.opTitle} — ${msg}`;


      deps.runner.debug("pipeline next-step failed", {
        pipelineId: spec.id,
        recipeId: activeRecipeId,
        stageId: step.stageId,
        instanceId: step.instanceId,
        opId: step.opId,
        error: msg,
      });
    }
  }


  function getVm(): PipelineVm {
    const spec = getSpec();
    const recipes = makeRecipesForPipeline(spec);

    const pipelines = catalogue.pipelines.map((p) => ({ id: p.id, title: p.title }));

    const inst = getInstalled();

    const stageSpecById = new Map(spec.stages.map((s) => [s.id, s]));
    const opSpecById = new Map(catalogue.ops.map((o) => [o.id, o]));

    const stages: StageVm[] = inst.stages
      .map((st) => {
        const stSpec = stageSpecById.get(st.stageId);
        if (!stSpec) return null;

        const ops: OpVm[] = st.ops
          .map((opInst) => {
            const opSpec = opSpecById.get(opInst.opId);
            if (!opSpec) return null;

            return {
              instanceId: opInst.instanceId,
              opId: opSpec.id,
              title: opSpec.title,
              input: opSpec.io.input,
              output: opSpec.io.output,
              state: opState[opInst.instanceId] ?? "idle",
              error: opError[opInst.instanceId],
              outputArtifact: opOutput[opInst.instanceId],
            };

          })
          .filter(Boolean) as OpVm[];

        const stState = stageState[st.stageId] ?? (ops.some((o) => o.state === "error") ? "error" : "idle");
        return {
          stageId: st.stageId,
          title: stSpec.title,
          input: stSpec.io.input,
          output: stSpec.io.output,
          ops,
          state: stState,
          error: stageError[st.stageId],
          outputArtifact: stageOutput[st.stageId],
        };

      })
      .filter(Boolean) as StageVm[];

    const vm: PipelineVm = {
      pipelines,
      recipes: recipes.map((r) => ({ id: r.id, title: r.title })),
      activePipelineId,
      activeRecipeId,
      statusText,
      stages,

      input: input ? { width: input.width, height: input.height, data: input } : undefined,

      nextIndex,
      totalOps: plan.length || stages.reduce((acc, s) => acc + s.ops.length, 0),
    };

    if (lastOutput?.type === "image") {
      vm.outputImage = { width: lastOutput.width, height: lastOutput.height, data: lastOutput.image };
    } else if (lastOutput?.type === "mask") {
      vm.outputMask = { width: lastOutput.width, height: lastOutput.height, data: lastOutput.mask };
    } else if (lastOutput?.type === "svg") {
      vm.outputSvg = { width: lastOutput.width, height: lastOutput.height, svg: lastOutput.svg };
    }


    return vm;
  }

  reset();

  return {
    getVm,
    setActivePipeline,
    setActiveRecipe,
    setInputImageData,
    getInstalled,
    setStageOps,
    runAll,
    runNext,
    reset,
  };
}

