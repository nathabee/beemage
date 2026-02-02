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
  }

  function ensureView(): PipelineView {
    if (view) return view;

    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline view: create + mount" });

    view = createPipelineView({
      hostEl: dom.viewPipeline,
      statusEl: dom.pipelineStatusEl,
      handlers: {
        onSelectPipeline: (id) => {
          actionLog.append({ scope: "panel", kind: "info", message: `Pipeline select: ${id}` });
          model.setActivePipeline(id);
          render();
          void tuning.setParamValue("pipeline", "mode", id);
        },
        onSelectRecipe: (id) => {
          actionLog.append({ scope: "panel", kind: "info", message: `Recipe select: ${id}` });
          model.setActiveRecipe(id);
          render();
          void tuning.setParamValue("pipeline", "recipe", id);
        },
        onRunAll: () => void runAll(),
        onNext: () => void runNext(),
        onReset: () => {
          model.reset();

          const img = readSourceImageData();
          if (img) model.setInputImageData(img);

          actionLog.append({ scope: "panel", kind: "info", message: "Pipeline reset (reseed from source)" });
          render();
        },

      },
    });

    view.mount();
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

    seedInputOnceIfMissing();
    await syncPipelineFromTuning();

    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline tab: render()" });
    render();
  }

  async function refresh(): Promise<void> {
    if (!mounted) return;

    actionLog.append({ scope: "panel", kind: "info", message: "Pipeline tab: refresh()" });

    seedInputOnceIfMissing();
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
  }

  return { bind, mount, unmount, refresh, dispose };
}
