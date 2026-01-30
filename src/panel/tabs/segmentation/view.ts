// src/panel/tabs/segmentation/view.ts
import type { Dom } from "../../app/dom";
import type { SegmentationModel } from "./model";
import type { TuningController } from "../../app/tuning/controller";

import {
  segmentationPresets,
  getSegmentationPresetById,
  type TuningPreset,
} from "../../app/tuning/presets/segmentationPresets";

type SegmentationView = {
  set(model: SegmentationModel): void;
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

export function createSegmentationView(dom: Dom, tuningController: TuningController): SegmentationView {
  const disposers: Array<() => void> = [];

  // local UI state: which preset is currently assigned to each step box
  const assignedByStep = new Map<string, string>(); // stepComponentId -> presetId

  // Stable lookup of step elements so recipe drop can update all labels
  const stepEls: Record<string, HTMLElement> = {
    "segmentation.resize": dom.segStepResizeEl,
    "segmentation.denoise": dom.segStepDenoiseEl,
    "segmentation.color": dom.segStepColorEl,
    "segmentation.threshold": dom.segStepThresholdEl,
    "segmentation.morphology": dom.segStepMorphologyEl,
  };

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
    // For recipe presets, we want the UI to clearly show "this recipe is active".
    // Simplest: stamp the recipe title onto all step boxes.
    for (const stepId of Object.keys(stepEls)) {
      assignedByStep.set(stepId, recipePreset.id);
      setAssignedLabel(stepEls[stepId], recipePreset.title);
    }

    // Also stamp recipe title on header
    setAssignedLabel(dom.segRecipeDropEl, recipePreset.title);
  }

  function attachDropZone(dropEl: HTMLElement, dropTarget: string) {
    const onDragEnter = (ev: DragEvent) => {
      // Some engines require dragenter preventDefault to allow drop consistently.
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
        // Recipe drop overrides step assignments visually.
        applyRecipeLabels(preset);
      } else {
        // Normal per-step drop: just update that step label.
        assignedByStep.set(dropTarget, preset.id);
        setAssignedLabel(dropEl, preset.title);

        // Optional: if user sets a single step, you might want to "deactivate" recipe header.
        // If you prefer that behavior, uncomment:
        // clearAssignedLabel(dom.segRecipeDropEl);
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
    attachDropZone(dom.segStepResizeEl, "segmentation.resize");
    attachDropZone(dom.segStepDenoiseEl, "segmentation.denoise");
    attachDropZone(dom.segStepColorEl, "segmentation.color");
    attachDropZone(dom.segStepThresholdEl, "segmentation.threshold");
    attachDropZone(dom.segStepMorphologyEl, "segmentation.morphology");
  }

  function set(_model: SegmentationModel) {
    // UI is driven by drag/drop; placeholder model doesn't affect it currently.
  }

  function dispose() {
    for (const fn of disposers) fn();
    disposers.length = 0;
  }

  initOnce();
  return { set, dispose };
}
