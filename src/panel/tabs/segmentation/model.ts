// src/panel/tabs/segmentation/model.ts
import type { Dom } from "../../app/dom";

export const SEG_STEP_IDS = [
  "segmentation.resize",
  "segmentation.denoise",
  "segmentation.color",
  "segmentation.threshold",
  "segmentation.morphology",
] as const;

export type SegStepId = (typeof SEG_STEP_IDS)[number];

export type SegmentationModel = {
  status: string;
  report: string;

  // UI state for presets
  assignedByStep: Map<SegStepId, string>; // stepId -> presetId
  activeRecipePresetId: string | null;

  // DOM mapping (single source of truth)
  getStepEls(dom: Dom): Record<SegStepId, HTMLElement>;
};

export function createSegmentationModel(): SegmentationModel {
  return {
    status: "Idle",
    report:
      [
        "Segmentation placeholder",
        "",
        "Planned:",
        "- Multi-step segmentation pipeline (process1..processN)",
        "- Per-step engine selection: native / opencv / auto",
        "- OpenCV injection + probing is managed in Settings (demo-only).",
      ].join("\n"),

    assignedByStep: new Map(),
    activeRecipePresetId: null,

    getStepEls(dom: Dom) {
      return {
        "segmentation.resize": dom.segStepResizeEl,
        "segmentation.denoise": dom.segStepDenoiseEl,
        "segmentation.color": dom.segStepColorEl,
        "segmentation.threshold": dom.segStepThresholdEl,
        "segmentation.morphology": dom.segStepMorphologyEl,
      };
    },
  };
}
