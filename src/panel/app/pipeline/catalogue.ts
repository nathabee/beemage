// src/panel/app/pipeline/catalogue.ts
import type {
  PipelineCatalogue,
  PipelineId,
  PipelineSpec,
  OpId,
  OpSpec,
  InstalledPipeline,
} from "./type";
import { makeInstanceId } from "./type";

function byId<T extends { id: string }>(items: ReadonlyArray<T>, id: string): T | null {
  return items.find((x) => x.id === id) ?? null;
}

/**
 * SINGLE source of truth for:
 * - pipeline names
 * - stage topology (and stage IO contracts)
 * - allowed ops per stage
 * - default ops per stage
 * - op definitions + dispatch ids
 */
export function createPipelineCatalogue(): PipelineCatalogue {
  // -----------------------------
  // Ops
  // -----------------------------
  const ops: OpSpec[] = [
    // Segmentation ops (dispatch to existing opsDispatch ids)
    {
      kind: "dispatch",
      id: "op.seg.resize",
      title: "Resize",
      io: { input: "image", output: "image" },
      dispatchId: "segmentation.resize",
      tuningId: "segmentation.resize",
    },
    {
      kind: "dispatch",
      id: "op.seg.denoise",
      title: "Denoise",
      io: { input: "image", output: "image" },
      dispatchId: "segmentation.denoise",
      tuningId: "segmentation.denoise",
    },
    {
      kind: "dispatch",
      id: "op.seg.color",
      title: "Color / Gray",
      io: { input: "image", output: "image" },
      dispatchId: "segmentation.color",
      tuningId: "segmentation.color",
    },
    {
      kind: "dispatch",
      id: "op.seg.threshold",
      title: "Threshold",
      io: { input: "image", output: "mask" },
      dispatchId: "segmentation.threshold",
      tuningId: "segmentation.threshold",
    },
    {
      kind: "dispatch",
      id: "op.seg.morphology",
      title: "Morphology cleanup",
      io: { input: "mask", output: "mask" },
      dispatchId: "segmentation.morphology",
      tuningId: "segmentation.morphology",
    },

        // Edge ops (dispatch to existing opsDispatch ids)
    {
      kind: "dispatch",
      id: "op.edge.resize",
      title: "Resize",
      io: { input: "image", output: "image" },
      dispatchId: "edge.resize",
      tuningId: "edge.resize",
    },
    {
      kind: "dispatch",
      id: "op.edge.threshold",
      title: "Threshold",
      io: { input: "image", output: "mask" },
      dispatchId: "edge.threshold",
      tuningId: "edge.threshold",
    },
    {
      kind: "dispatch",
      id: "op.edge.morphology",
      title: "Morphology cleanup",
      io: { input: "mask", output: "mask" },
      dispatchId: "edge.morphology",
      tuningId: "edge.morphology",
    },
    {
      kind: "dispatch",
      id: "op.edge.extract",
      title: "Edge extract",
      io: { input: "mask", output: "mask" },
      dispatchId: "edge.extract",
      tuningId: "edge.extract",
    },

    {
      kind: "dispatch",
      id: "op.svg.create",
      title: "Create SVG",
      io: { input: "mask", output: "svg" },
      dispatchId: "svg.create",
      tuningId: "svg.create",
    },

    {
  kind: "dispatch",
  id: "op.mage.clean.removeSmallComponents",
  title: "Remove small components",
  io: { input: "mask", output: "mask" },
  dispatchId: "mage.clean.removeSmallComponents",
  tuningId: "mage.clean.removeSmallComponents",
},

    // Useful generic ops (JS) for testing / wiring (optional)
    {
      kind: "js",
      id: "op.util.pass",
      title: "Pass-through",
      io: { input: "image", output: "image" },
      run: ({ input }) => input,
    },
  ];

  // -----------------------------
  // Pipelines
  // -----------------------------
  const pipelines: PipelineSpec[] = [
    {
      id: "segmentation",
      title: "Segmentation",
      implemented: true,
      description: "Multi-step segmentation pipeline (image -> mask).",
      stages: [
        {
          id: "stage.seg.prep",
          title: "Prep",
          io: { input: "image", output: "image" },
          allowedOps: ["op.seg.resize", "op.util.pass"],
          defaultOps: ["op.seg.resize"],
        },
        {
          id: "stage.seg.denoise",
          title: "Denoise",
          io: { input: "image", output: "image" },
          allowedOps: ["op.seg.denoise", "op.util.pass"],
          defaultOps: ["op.seg.denoise"],
        },
        {
          id: "stage.seg.features",
          title: "Color / channel features",
          io: { input: "image", output: "image" },
          allowedOps: ["op.seg.color", "op.util.pass"],
          defaultOps: ["op.seg.color"],
        },
        {
          id: "stage.seg.binarize",
          title: "Binarize",
          io: { input: "image", output: "mask" },
          allowedOps: ["op.seg.threshold"],
          defaultOps: ["op.seg.threshold"],
        },
        {
          id: "stage.seg.cleanup",
          title: "Mask cleanup",
          io: { input: "mask", output: "mask" },
          allowedOps: ["op.seg.morphology"],
          defaultOps: ["op.seg.morphology"],
        },
      ],
    },
    {
      id: "svg",
      title: "SVG",
      implemented: true,
      description: "Image to SVG outline (resize -> threshold -> morph -> edge -> svg).",
      stages: [
        {
          id: "stage.svg.prep",
          title: "Prep",
          io: { input: "image", output: "image" },
          allowedOps: ["op.edge.resize", "op.util.pass"],
          defaultOps: ["op.edge.resize"],
        },
        {
          id: "stage.svg.binarize",
          title: "Binarize",
          io: { input: "image", output: "mask" },
          allowedOps: ["op.edge.threshold"],
          defaultOps: ["op.edge.threshold"],
        },
        {
          id: "stage.svg.cleanup",
          title: "Mask cleanup",
          io: { input: "mask", output: "mask" },
          allowedOps: ["op.edge.morphology"],
          defaultOps: ["op.edge.morphology"],
        },
        {
          id: "stage.svg.edge",
          title: "Extract edges",
          io: { input: "mask", output: "mask" },
          allowedOps: ["op.edge.extract"],
          defaultOps: ["op.edge.extract"],
        },
        {
          id: "stage.svg.emit",
          title: "Create SVG",
          io: { input: "mask", output: "svg" },
          allowedOps: ["op.svg.create"],
          defaultOps: ["op.svg.create"],
        },
      ],
    },

        {
      id: "edge",
      title: "Edge",
      implemented: true,
      description: "Edge extraction pipeline (image -> mask -> edges).",
      stages: [
        {
          id: "stage.edge.prep",
          title: "Prep",
          io: { input: "image", output: "image" },
          allowedOps: ["op.edge.resize", "op.util.pass"],
          defaultOps: ["op.edge.resize"],
        },
        {
          id: "stage.edge.binarize",
          title: "Binarize",
          io: { input: "image", output: "mask" },
          allowedOps: ["op.edge.threshold"],
          defaultOps: ["op.edge.threshold"],
        },
        {
          id: "stage.edge.cleanup",
          title: "Mask cleanup",
          io: { input: "mask", output: "mask" },
          allowedOps: ["op.edge.morphology"],
          defaultOps: ["op.edge.morphology"],
        },
        {
          id: "stage.edge.extract",
          title: "Extract edges",
          io: { input: "mask", output: "mask" },
          allowedOps: ["op.edge.extract"],
          defaultOps: ["op.edge.extract"],
        },
      ],
    },

{
  id: "cleanup",
  title: "Cleanup (min area)",
  implemented: true,
  description: "Image -> mask -> cleanup (morphology + remove small components).",
  stages: [
    {
      id: "stage.cleanup.prep",
      title: "Prep",
      io: { input: "image", output: "image" },
      allowedOps: ["op.seg.resize", "op.util.pass"],
      defaultOps: ["op.seg.resize"],
    },
    {
      id: "stage.cleanup.binarize",
      title: "Binarize",
      io: { input: "image", output: "mask" },
      allowedOps: ["op.seg.threshold"],
      defaultOps: ["op.seg.threshold"],
    },
    {
      id: "stage.cleanup.morph",
      title: "Mask cleanup",
      io: { input: "mask", output: "mask" },
      allowedOps: ["op.seg.morphology", "op.mage.clean.removeSmallComponents"],
      defaultOps: ["op.seg.morphology", "op.mage.clean.removeSmallComponents"],
    },
  ],
},


    
    // Future pipelines (visible in UI, but not runnable yet)
    {
      id: "surface",
      title: "Surface",
      implemented: false,
      description: "Future: region labeling + vectorize pipeline.",
      stages: [],
    },
  ];

  function getPipeline(id: PipelineId): PipelineSpec | null {
    return byId(pipelines, id);
  }

  function getOp(id: OpId): OpSpec | null {
    return byId(ops, id);
  }

  function makeDefaultInstalled(pipelineId: PipelineId): InstalledPipeline | null {
    const p = getPipeline(pipelineId);
    if (!p) return null;

    return {
      pipelineId: p.id,
      stages: p.stages.map((s) => ({
        stageId: s.id,
        ops: (s.defaultOps ?? []).map((opId, i) => ({
          instanceId: makeInstanceId(s.id, i),
          opId,
        })),
      })),
    };
  }

  return {
    pipelines,
    ops,
    getPipeline,
    getOp,
    makeDefaultInstalled,
  };
}
