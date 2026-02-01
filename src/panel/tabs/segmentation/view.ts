// src/panel/tabs/segmentation/view.ts
import type { Dom } from "../../app/dom";
import type { SegmentationModel, SegStepId } from "./model";
import type { TuningController } from "../../app/tuning/controller";

import {
  segmentationPresets,
  getSegmentationPresetById,
  type TuningPreset,
} from "../../app/tuning/presets/segmentationPresets";

type SegmentationView = {
  set(model: SegmentationModel): void;
  resetUi(): void;
  dispose(): void;
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (typeof text === "string") e.textContent = text;
  return e;
}

function presetMatchesDropTarget(preset: TuningPreset, dropTarget: string): boolean {
  // dropTarget is either:
  // - "recipe" (pipeline header)
  // - a component id like "segmentation.threshold"
  if (dropTarget === "recipe") return preset.target === "segmentation";
  return preset.target === dropTarget;
}

export function createSegmentationView(
  dom: Dom,
  tuningController: TuningController,
  model: SegmentationModel,
): SegmentationView {
  const disposers: Array<() => void> = [];

  const stepEls = model.getStepEls(dom);

  function renderPresetLibrary() {
    const host = dom.segPresetListEl;
    host.innerHTML = "";

    for (const p of segmentationPresets) {
      const card = el("div", "segPresetCard");
      card.setAttribute("draggable", "true");
      card.setAttribute("data-preset-id", p.id);
      card.setAttribute("aria-label", `Preset: ${p.title}`);

      const title = el("div", "segPresetCardTitle", p.title);
      const desc = el("div", "segPresetCardDesc", p.description || `Target: ${p.target}`);

      card.appendChild(title);
      card.appendChild(desc);

      const onDragStart = (ev: DragEvent) => {
        if (!ev.dataTransfer) return;
        ev.dataTransfer.setData("text/plain", p.id);
        ev.dataTransfer.effectAllowed = "copy";
      };

      card.addEventListener("dragstart", onDragStart);
      disposers.push(() => card.removeEventListener("dragstart", onDragStart));

      host.appendChild(card);
    }
  }

  function setAssignedLabel(dropEl: HTMLElement, text: string) {
    const assigned = dropEl.querySelector('[data-assigned]') as HTMLElement | null;
    if (!assigned) return;
    assigned.textContent = text;
    assigned.classList.remove("muted");
  }

  function clearAssignedLabel(dropEl: HTMLElement) {
    const assigned = dropEl.querySelector('[data-assigned]') as HTMLElement | null;
    if (!assigned) return;
    assigned.textContent = "Drop preset…";
    assigned.classList.add("muted");
  }

  function applyRecipeLabels(recipePreset: TuningPreset) {
    // Stamp recipe title onto all step boxes + header
    for (const stepId of Object.keys(stepEls) as SegStepId[]) {
      model.assignedByStep.set(stepId, recipePreset.id);
      setAssignedLabel(stepEls[stepId], recipePreset.title);
    }

    model.activeRecipePresetId = recipePreset.id;
    setAssignedLabel(dom.segRecipeDropEl, recipePreset.title);
  }

  function applySingleStepLabel(stepId: SegStepId, preset: TuningPreset, dropEl: HTMLElement) {
    model.assignedByStep.set(stepId, preset.id);
    setAssignedLabel(dropEl, preset.title);

    // Optional policy choice:
    // If user edits a single step, keep the recipe header as-is OR clear it.
    // I’d keep it as-is unless you explicitly want “recipe deactivated”.
    // model.activeRecipePresetId = null;
    // clearAssignedLabel(dom.segRecipeDropEl);
  }

  function attachDropZone(dropEl: HTMLElement, dropTarget: string) {
    const onDragEnter = (ev: DragEvent) => {
      ev.preventDefault();
      dropEl.classList.add("is-over");
    };

    const onDragOver = (ev: DragEvent) => {
      ev.preventDefault();
      dropEl.classList.add("is-over");
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
    };

    const onDragLeave = () => {
      dropEl.classList.remove("is-over");
    };

    const onDrop = async (ev: DragEvent) => {
      ev.preventDefault();
      dropEl.classList.remove("is-over");

      const presetId = ev.dataTransfer?.getData("text/plain") || "";
      if (!presetId) return;

      const preset = getSegmentationPresetById(presetId);
      if (!preset) return;

      if (!presetMatchesDropTarget(preset, dropTarget)) {
        // Hard reject: wrong target
        return;
      }

      if (dropTarget === "recipe") {
        applyRecipeLabels(preset);
      } else {
        // dropTarget is a step id
        applySingleStepLabel(dropTarget as SegStepId, preset, dropEl);
      }

      // Apply to tuning store (controller logs + rerender)
      await tuningController.applyPreset(preset);
    };

    dropEl.addEventListener("dragenter", onDragEnter);
    dropEl.addEventListener("dragover", onDragOver);
    dropEl.addEventListener("dragleave", onDragLeave);
    dropEl.addEventListener("drop", onDrop);

    disposers.push(() => dropEl.removeEventListener("dragenter", onDragEnter));
    disposers.push(() => dropEl.removeEventListener("dragover", onDragOver));
    disposers.push(() => dropEl.removeEventListener("dragleave", onDragLeave));
    disposers.push(() => dropEl.removeEventListener("drop", onDrop));
  }

  function initOnce() {
    renderPresetLibrary();

    // Recipe drop (full pipeline preset)
    attachDropZone(dom.segRecipeDropEl, "recipe");

    // Step drops
    attachDropZone(stepEls["segmentation.resize"], "segmentation.resize");
    attachDropZone(stepEls["segmentation.denoise"], "segmentation.denoise");
    attachDropZone(stepEls["segmentation.color"], "segmentation.color");
    attachDropZone(stepEls["segmentation.threshold"], "segmentation.threshold");
    attachDropZone(stepEls["segmentation.morphology"], "segmentation.morphology");
  }

  function resetUi() {
    model.assignedByStep.clear();
    model.activeRecipePresetId = null;

    clearAssignedLabel(dom.segRecipeDropEl);
    for (const stepId of Object.keys(stepEls) as SegStepId[]) {
      clearAssignedLabel(stepEls[stepId]);
    }
  }

  function set(_model: SegmentationModel) {
    // If later you want: re-render labels from model state.
    // For now, drag/drop mutates DOM immediately, so nothing to do.
  }

  function dispose() {
    for (const fn of disposers) fn();
    disposers.length = 0;
  }

  initOnce();
  return { set, resetUi, dispose };
}
