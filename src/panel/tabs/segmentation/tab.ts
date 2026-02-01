// src/panel/tabs/segmentation/tab.ts
import type { Dom } from "../../app/dom";
import type { createBus } from "../../app/bus";
import { logTrace, logWarn, logError, traceScope } from "../../app/log";
import { withBusy } from "../../app/state";

import type { TuningController } from "../../app/tuning/controller";

import { createSegmentationModel } from "./model";
import { createSegmentationView } from "./view";

import { runImageOp, runMaskOp, type SegImageInput } from "./ops/ops";
import { renderMask } from "../contour/lib/morphology";
import type { SegStepId } from "./model";

type Bus = ReturnType<typeof createBus>;

type SegSession = {
  width: number;
  height: number;
  stepIndex: number; // 0..5 (5 = done)
  artifact:
  | { kind: "image"; image: ImageData }
  | { kind: "mask"; mask: Uint8Array };
};

const STEPS: Array<{
  id:
  | "segmentation.resize"
  | "segmentation.denoise"
  | "segmentation.color"
  | "segmentation.threshold"
  | "segmentation.morphology";
  kind: "image" | "mask";
}> = [
    { id: "segmentation.resize", kind: "image" },
    { id: "segmentation.denoise", kind: "image" },
    { id: "segmentation.color", kind: "image" },
    { id: "segmentation.threshold", kind: "mask" },
    { id: "segmentation.morphology", kind: "mask" },
  ];

export function createSegmentationTab(dom: Dom, _bus: Bus, tuningController: TuningController) {
  const model = createSegmentationModel();
  const view = createSegmentationView(dom, tuningController, model);

  let session: SegSession | null = null;

  const stepEls = model.getStepEls(dom);


  function setStatus(text: string) {
    dom.segStatusEl.textContent = text || "";
  }

  function clearStepClasses() {
    for (const el of Object.values(stepEls)) {
      el.classList.remove("is-active");
      el.classList.remove("is-done");
    }
  }


  function setActiveStep(stepId: SegStepId | null) {
    // Clear all first
    for (const el of Object.values(stepEls)) {
      el.classList.remove("is-active");
      el.classList.remove("is-done");
    }

    if (!session) return;

    // Mark completed steps as done (0..stepIndex-1)
    for (let i = 0; i < Math.min(session.stepIndex, STEPS.length); i++) {
      const doneId = STEPS[i].id;
      stepEls[doneId]?.classList.add("is-done");
    }

    // Mark current active step (usually the next step to run)
    if (stepId) stepEls[stepId]?.classList.add("is-active");
  }

  function renderPreviewFromSession() {
    if (!session) return;

    const { width, height } = session;
    dom.segMaskCanvasEl.width = width;
    dom.segMaskCanvasEl.height = height;

    const ctx = dom.segMaskCanvasEl.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
    if (!ctx) {
      logError("[segmentation] preview: missing 2D context");
      return;
    }

    if (session.artifact.kind === "image") {
      ctx.putImageData(session.artifact.image, 0, 0);
      return;
    }

    // mask
    ctx.putImageData(renderMask(session.artifact.mask, width, height, true), 0, 0);
  }

  function buildSessionFromSource(): SegSession | null {
    const src = dom.srcCanvasEl; // choose a canonical source; swap later if needed
    const width = src.width;
    const height = src.height;

    if (!width || !height) return null;

    const sctx = src.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
    if (!sctx) return null;

    const img = sctx.getImageData(0, 0, width, height);

    return {
      width,
      height,
      stepIndex: 0,
      artifact: { kind: "image", image: img },
    };
  }

  async function runNextStep(): Promise<void> {
    if (!session) {
      session = buildSessionFromSource();
      if (!session) {
        setStatus("No image");
        return;
      }
    }

    if (session.stepIndex >= STEPS.length) {
      setStatus("Done");

      return;
    }

    const step = STEPS[session.stepIndex];
    const { width, height } = session;

    setActiveStep(step.id);
    setStatus(`Running: ${step.id}`);

    traceScope("[segmentation] next step", {
      stepIndex: session.stepIndex,
      stepId: step.id,
      width,
      height,
      artifact: session.artifact.kind,
    });

    // Steps 1-3: image -> image
    if (step.id === "segmentation.resize" || step.id === "segmentation.denoise" || step.id === "segmentation.color") {
      if (session.artifact.kind !== "image") {
        throw new Error(`[segmentation] step ${step.id} expected image input, got mask`);
      }

      const out: SegImageInput = await runImageOp(step.id, {
        input: { kind: "image", image: session.artifact.image },
        width,
        height,
      });

      if (out.kind !== "image") {
        throw new Error(`[segmentation] step ${step.id} returned non-image`);
      }

      const nextId = session.stepIndex < STEPS.length ? STEPS[session.stepIndex].id : null;
      setActiveStep(nextId);

      session.artifact = { kind: "image", image: out.image };
      session.stepIndex++;
      renderPreviewFromSession();
      setStatus(`Done: ${step.id}`);
      return;
    }

    // Step 4: threshold image -> mask
    if (step.id === "segmentation.threshold") {
      if (session.artifact.kind !== "image") {
        throw new Error(`[segmentation] threshold expected image input, got mask`);
      }

      const mask = await runMaskOp("segmentation.threshold", {
        input: { kind: "image", image: session.artifact.image },
        width,
        height,
      });

      session.artifact = { kind: "mask", mask };
      session.stepIndex++;
      renderPreviewFromSession();
      setActiveStep(null);
      setStatus("Done: segmentation.threshold");
      return;
    }

    // Step 5: morphology mask -> mask
    if (step.id === "segmentation.morphology") {
      if (session.artifact.kind !== "mask") {
        throw new Error(`[segmentation] morphology expected mask input, got image`);
      }

      const mask = await runMaskOp("segmentation.morphology", {
        mask: session.artifact.mask,
        width,
        height,
      });

      session.artifact = { kind: "mask", mask };
      session.stepIndex++;
      renderPreviewFromSession();
      setActiveStep(null);
      setStatus("Done: segmentation.morphology");
      return;
    }
  }

  async function runAll(): Promise<void> {
    // Start fresh (no recompute within the run; just sequential steps)
    session = buildSessionFromSource();
    if (!session) {
      setStatus("No image");
      return;
    }

    renderPreviewFromSession();
    setStatus("Running all…");

    while (session && session.stepIndex < STEPS.length) {
      await runNextStep();
    }

    setStatus("Done");
  }

  function reset() {
    // Reset the preset UI labels
    view.resetUi();

    // Reset pipeline state
    session = null;
    clearStepClasses();

    // Immediately re-seed from source so preview never goes blank
    const seeded = buildSessionFromSource();
    if (seeded) {
      session = seeded;
      setActiveStep(STEPS[0]?.id ?? null);
      renderPreviewFromSession();
      setStatus("Ready (reset to source)");
      return;
    }

    // No source available -> clear preview
    setStatus("No image");

    const ctx = dom.segMaskCanvasEl.getContext("2d") as CanvasRenderingContext2D | null;
    if (ctx) ctx.clearRect(0, 0, dom.segMaskCanvasEl.width, dom.segMaskCanvasEl.height);
  }


  function bind() {
    dom.segRunBtn.addEventListener("click", () => {
      void withBusy(dom, async () => {
        try {
          await runAll();
        } catch (err) {
          logError("[segmentation] runAll exception", { error: err instanceof Error ? err.message : String(err) });
          setStatus("Failed");
        }
      });
    });

    dom.segNextBtn.addEventListener("click", () => {
      void withBusy(dom, async () => {
        try {
          await runNextStep();
        } catch (err) {
          logError("[segmentation] nextStep exception", { error: err instanceof Error ? err.message : String(err) });
          setStatus("Failed");
        }
      });
    });

    dom.segResetBtn.addEventListener("click", () => reset());
  }

  function mount() {
    logTrace("[segmentation] mount");

    // If we already have a session (e.g. returning to the tab), just show it.
    if (session) {
      renderPreviewFromSession();
      setStatus("Ready");
      view.set(model);
      return;
    }

    // Otherwise, try to seed from the original input canvas (loaded in contour tab).
    const seeded = buildSessionFromSource();
    if (seeded) {
      session = seeded;
      clearStepClasses();
      setActiveStep(STEPS[0]?.id ?? null);
      renderPreviewFromSession();
      setStatus("Ready (source loaded)");
    } else {
      clearStepClasses();

      const ctx = dom.segMaskCanvasEl.getContext("2d") as CanvasRenderingContext2D | null;
      if (ctx) ctx.clearRect(0, 0, dom.segMaskCanvasEl.width, dom.segMaskCanvasEl.height);

      setStatus("No image");
    }

    view.set(model);
  }


  function refresh() {
    logTrace("[segmentation] refresh");
    view.set(model);

    // Keep session; do not reset on refresh.
    if (session) {
      renderPreviewFromSession();
      return;
    }

    // If no session yet but the contour tab already loaded an image, show it now.
    const seeded = buildSessionFromSource();
    if (seeded) {
      session = seeded;
      clearStepClasses();
      setActiveStep(STEPS[0]?.id ?? null);
      renderPreviewFromSession();
      setStatus("Ready (source loaded)");
      return;
    }

    // Otherwise keep UI clean and honest.
    setStatus("No image");
  }


  function unmount() { }

  function dispose() {
    view.dispose();
  }

  return { bind, mount, refresh, unmount, dispose };
}
