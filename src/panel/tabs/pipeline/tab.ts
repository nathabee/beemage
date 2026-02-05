// src/panel/tabs/pipeline/tab.ts
import type { Dom } from "../../app/dom";
import type { Bus } from "../../app/bus";
import { createPipelineView } from "./view";
import type { PipelineView } from "./view";
import { createPipelineModel } from "./model";

import * as debugTrace from "../../../shared/debugTrace";
import * as actionLog from "../../../shared/actionLog";
import type { TuningController } from "../../app/tuning/controller";
import type { ParamValue } from "../../app/tuning/types";

export function createPipelineTab(dom: Dom, _bus: Bus, tuning: TuningController) {
  const model = createPipelineModel({
    runner: {
      getEffectiveParams: async (tuningId: string) => {
        const p = await tuning.getEffectiveParams(tuningId).catch(() => ({} as Record<string, ParamValue>));
        return p as Record<string, ParamValue>;
      },
      debug: (message, meta) =>
        debugTrace.append({
          scope: "panel",
          kind: "debug",
          message,
          meta,
        }),
    },
  });

  let view: PipelineView | null = null;
  let mounted = false;

  // Track which tuning subtree is currently mounted into the Pipeline tab slot.
  let mountedScopeRootId: string | null = null;
  let lastSurfacedError: string | null = null;

  function surfacePipelineErrorsToActionLog(): void {
    const vm = model.getVm();
    const hasError = vm.stages.some((s) => s.state === "error") || String(vm.statusText).toLowerCase().includes("error");

    if (!hasError) {
      lastSurfacedError = null;
      return;
    }

    const msg = String(vm.statusText || "Pipeline error");
    if (msg === lastSurfacedError) return;
    lastSurfacedError = msg;

    actionLog.append({
      scope: "panel",
      kind: "error",
      message: `Pipeline: ${msg}`,
    });
  }

  function clearPipelineTuningMount(): void {
    dom.pipelineTuningMountEl.innerHTML = "";
  }

  function pickScopeCandidates(pipelineId: string): string[] {
    // Universal strategy:
    // 1) Try the pipeline id directly (segmentation, later edge/clean/surface if you make them root nodes).
    // 2) Try "pipeline.<id>" in case you decide to nest under pipeline.* later.
    // 3) Fall back to "pipeline" (UI state node: mode/recipe).
    return [pipelineId, `pipeline.${pipelineId}`, "pipeline"];
  }

  function mountPipelineTuningForPipelineId(pipelineId: string): void {
    const candidates = pickScopeCandidates(pipelineId);

    // If we’re already mounted to the best candidate (first one that works), we’ll keep it.
    // But we don’t know which one works until we try. So:
    // - If current mount matches any candidate, we still attempt the first candidate first,
    //   and short-circuit only if it equals mountedScopeRootId.
    if (mountedScopeRootId === candidates[0]) return;

    clearPipelineTuningMount();

    let mountedOk: string | null = null;
    let lastErr: unknown = null;

    for (const scopeRootId of candidates) {
      try {
        tuning.mount({ mountEl: dom.pipelineTuningMountEl, scopeRootId });
        mountedOk = scopeRootId;
        break;
      } catch (e) {
        lastErr = e;
        // Clear mount slot before next attempt (defensive).
        clearPipelineTuningMount();
      }
    }

    if (!mountedOk) {
      // Absolute fallback: leave it empty, but log what happened.
      mountedScopeRootId = null;

      actionLog.append({
        scope: "panel",
        kind: "info",
        message: `Pipeline tuning mount failed for "${pipelineId}" (no matching scope).`,
      });

      debugTrace.append({
        scope: "panel",
        kind: "error",
        message: "Pipeline tuning mount failed (no candidate scopeRootId worked)",
        meta: {
          pipelineId,
          candidates,
          error: lastErr instanceof Error ? lastErr.message : String(lastErr),
        },
      });

      return;
    }

    mountedScopeRootId = mountedOk;

    actionLog.append({
      scope: "panel",
      kind: "info",
      message: `Pipeline tuning mount: pipelineId=${pipelineId}, scopeRootId=${mountedOk}`,
    });
  }

  function mountScopedTuningForActivePipeline(): void {
    const vm = model.getVm();
    const pipelineId = typeof vm.activePipelineId === "string" ? vm.activePipelineId : "segmentation";
    mountPipelineTuningForPipelineId(pipelineId);
  }

  function readSourceImageData(): ImageData | null {
    const src = dom.srcCanvasEl;
    const w = src.width;
    const h = src.height;
    if (!w || !h) return null;

    const ctx = src.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
    if (!ctx) return null;

    return ctx.getImageData(0, 0, w, h);
  }

  function seedInputOnceIfMissing(): void {
    const vm = model.getVm();
    if (vm.input) return;
    const img = readSourceImageData();
    if (!img) return;
    model.setInputImageData(img);
  }

  function refreshInputForRun(): void {
    const img = readSourceImageData();
    if (!img) return;
    model.setInputImageData(img);
  }

  async function syncPipelineFromTuning(): Promise<void> {
    const params = await tuning.getEffectiveParams("pipeline").catch(() => ({} as Record<string, ParamValue>));

    const modeRaw = params?.mode;
    const recipeRaw = params?.recipe;

    const mode = typeof modeRaw === "string" ? modeRaw : "segmentation";
    const recipe = typeof recipeRaw === "string" ? recipeRaw : "default";

    model.setActivePipeline(mode);
    model.setActiveRecipe(recipe);

    // Critical: Pipeline tab tuning must match the selected pipeline
    mountScopedTuningForActivePipeline();
  }

  function ensureView(): PipelineView {
    if (view) return view;

    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline view: create + mount" });

    view = createPipelineView({
      hostEl: dom.pipelineViewMountEl,
      statusEl: dom.pipelineStatusEl,
      handlers: {
        onSelectPipeline: (id) => {
          actionLog.append({ scope: "panel", kind: "info", message: `Pipeline select: ${id}` });

          model.setActivePipeline(id);

          // Persist selection
          void tuning.setParamValue("pipeline", "mode", id);

          // Remount tuning subtree to match selection
          mountScopedTuningForActivePipeline();

          render();
        },

        onSelectRecipe: (id) => {
          actionLog.append({ scope: "panel", kind: "info", message: `Recipe select: ${id}` });

          model.setActiveRecipe(id);

          // Persist selection
          void tuning.setParamValue("pipeline", "recipe", id);

          render();
        },

        onRunAll: () => void runAll(),
        onNext: () => void runNext(),
        onReset: () => {
          model.reset();

          const img = readSourceImageData();
          if (img) model.setInputImageData(img);

          actionLog.append({ scope: "panel", kind: "info", message: "Pipeline reset (reseed from source)" });

          mountScopedTuningForActivePipeline();
          render();
        },
      },
    });

    view.mount();

    // Ensure tuning mount exists even if user never touches the select.
    mountScopedTuningForActivePipeline();

    return view;
  }

  function render(): void {
    ensureView().render(model.getVm());
  }

  async function runAll(): Promise<void> {
    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline run: all" });

    refreshInputForRun();

    try {
      await model.runAll();
    } finally {
      render();
    }
  }

  async function runNext(): Promise<void> {
    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline run: next" });

    seedInputOnceIfMissing();

    try {
      await model.runNext();
    } finally {
      render();
    }
  }

  function bind(): void {
    // view binds its own internal UI
  }

  async function mount(): Promise<void> {
    mounted = true;

    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline tab: mount()" });

    // Always pull the latest source image on first entry to the tab.
    refreshInputForRun();

    await syncPipelineFromTuning();

    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline tab: render()" });
    render();
  }

  async function refresh(): Promise<void> {
    if (!mounted) return;

    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline tab: refresh()" });

    // When user comes back to Pipeline tab, keep it in sync with the source canvas.
    refreshInputForRun();

    await syncPipelineFromTuning();
    render();
  }


  function unmount(): void {
    mounted = false;
    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline tab: unmount()" });
  }

  function dispose(): void {
    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline tab: dispose()" });

    view?.dispose();
    view = null;

    mountedScopeRootId = null;
    clearPipelineTuningMount();
  }

  return { bind, mount, unmount, refresh, dispose };
}
