// src/panel/tabs/pipeline/view.ts
import { createPipelineCatalogue } from "../../app/pipeline/catalogue";
import type { Artifact, ImageArtifact, MaskArtifact, PipelineRunResult, StageRunResult } from "../../app/pipeline/type";

export type PipelineViewHandlers = {
  onSelectPipeline: (id: string) => void;
  onSelectRecipe: (id: string) => void;
  onRunAll: () => void;
  onNext: () => void;
  onReset: () => void;
};

export type PipelineView = {
  mount(): void;
  render(vm: any): void;
  dispose(): void;
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (typeof text === "string") e.textContent = text;
  return e;
}

function isImage(a: Artifact): a is ImageArtifact {
  return a.type === "image";
}

function isMask(a: Artifact): a is MaskArtifact {
  return a.type === "mask";
}

function drawImageToCanvas(canvas: HTMLCanvasElement, img: ImageData): void {
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
  if (!ctx) return;
  ctx.putImageData(img, 0, 0);
}

function drawMaskToCanvas(canvas: HTMLCanvasElement, mask: Uint8Array, width: number, height: number): void {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
  if (!ctx) return;

  const img = ctx.createImageData(width, height);
  const d = img.data;

  for (let i = 0; i < width * height; i++) {
    const v = mask[i] ?? 0;
    const j = i * 4;
    d[j] = v;
    d[j + 1] = v;
    d[j + 2] = v;
    d[j + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
}

function statusLineFromResult(res: PipelineRunResult | null): string {
  if (!res) return "Idle";
  if (res.status === "ok") return `OK: ${res.title}`;
  return `ERROR: ${res.error ?? res.title}`;
}

export function createPipelineView(args: {
  hostEl: HTMLElement;
  statusEl: HTMLElement;
  handlers: PipelineViewHandlers;
}): PipelineView {
  const { hostEl, statusEl, handlers } = args;

  let mounted = false;

  let root: HTMLDivElement | null = null;

  let selectPipeline: HTMLSelectElement | null = null;
  let selectRecipe: HTMLSelectElement | null = null;

  let btnRunAll: HTMLButtonElement | null = null;
  let btnNext: HTMLButtonElement | null = null;
  let btnReset: HTMLButtonElement | null = null;

  let descEl: HTMLParagraphElement | null = null;

  let inputCanvas: HTMLCanvasElement | null = null;
  let currentCanvas: HTMLCanvasElement | null = null;

  let stagesHost: HTMLDivElement | null = null;

  function clearHost(): void {
    while (hostEl.firstChild) hostEl.removeChild(hostEl.firstChild);
  }

  function ensureMounted(): void {
    if (mounted) return;
    mounted = true;

    clearHost();

    root = el("div", { class: "card" });

    descEl = el(
      "p",
      { class: "muted", style: "margin-top:0;" },
      "Universal pipeline runner. Select a pipeline and run it.",
    );

    const controls = el("div", { class: "row", style: "align-items:center; gap:10px; flex-wrap:wrap;" });

    const lblPipeline = el("label", { class: "fieldInline" });
    lblPipeline.appendChild(el("span", {}, "Pipeline"));
    selectPipeline = el("select") as HTMLSelectElement;
    lblPipeline.appendChild(selectPipeline);

    const lblRecipe = el("label", { class: "fieldInline" });
    lblRecipe.appendChild(el("span", {}, "Recipe"));
    selectRecipe = el("select") as HTMLSelectElement;
    lblRecipe.appendChild(selectRecipe);

    btnRunAll = el("button", { type: "button" }, "Run all") as HTMLButtonElement;
    btnNext = el("button", { type: "button" }, "Next step") as HTMLButtonElement;
    btnReset = el("button", { type: "button" }, "Reset") as HTMLButtonElement;

    controls.appendChild(lblPipeline);
    controls.appendChild(lblRecipe);
    controls.appendChild(btnRunAll);
    controls.appendChild(btnNext);
    controls.appendChild(btnReset);

    const grid = el("div", { class: "grid4", style: "margin-top:12px;" });

    const inputCard = el("div", { class: "card" });
    inputCard.appendChild(el("div", { class: "cardTitle" }, "Input (from source)"));
    inputCanvas = el("canvas", { class: "canvas", "aria-label": "Pipeline input preview" }) as HTMLCanvasElement;
    inputCard.appendChild(inputCanvas);

    const currentCard = el("div", { class: "card" });
    currentCard.appendChild(el("div", { class: "cardTitle" }, "Current output"));
    currentCanvas = el("canvas", { class: "canvas", "aria-label": "Pipeline current output preview" }) as HTMLCanvasElement;
    currentCard.appendChild(currentCanvas);

    const stagesCard = el("div", { class: "card", style: "grid-column:1 / -1;" });
    stagesCard.appendChild(el("div", { class: "cardTitle" }, "Stages"));
    stagesHost = el("div");
    stagesCard.appendChild(stagesHost);

    grid.appendChild(inputCard);
    grid.appendChild(currentCard);
    grid.appendChild(stagesCard);

    root.appendChild(descEl);
    root.appendChild(controls);
    root.appendChild(grid);

    hostEl.appendChild(root);

    selectPipeline.addEventListener("change", () => {
      const id = selectPipeline ? selectPipeline.value : "segmentation";
      handlers.onSelectPipeline(id);
    });

    selectRecipe.addEventListener("change", () => {
      const id = selectRecipe ? selectRecipe.value : "default";
      handlers.onSelectRecipe(id);
    });

    btnRunAll.addEventListener("click", () => handlers.onRunAll());
    btnNext.addEventListener("click", () => handlers.onNext());
    btnReset.addEventListener("click", () => handlers.onReset());
  }

  function renderSelects(vm: any): void {
    if (!selectPipeline || !selectRecipe) return;

    const pipelines = Array.isArray(vm?.pipelines) ? vm.pipelines : [];
    const recipes = Array.isArray(vm?.recipes) ? vm.recipes : [];

    const activePipelineId = typeof vm?.activePipelineId === "string" ? vm.activePipelineId : "segmentation";
    const activeRecipeId = typeof vm?.activeRecipeId === "string" ? vm.activeRecipeId : "default";

    selectPipeline.innerHTML = "";
    for (const p of pipelines) {
      const opt = el("option") as HTMLOptionElement;
      opt.value = p.id;
      opt.textContent = p.title;
      if (p.id === activePipelineId) opt.selected = true;
      selectPipeline.appendChild(opt);
    }

    selectRecipe.innerHTML = "";
    for (const r of recipes) {
      const opt = el("option") as HTMLOptionElement;
      opt.value = r.id;
      opt.textContent = r.title;
      if (r.id === activeRecipeId) opt.selected = true;
      selectRecipe.appendChild(opt);
    }
  }

  function drawInput(vm: any): void {
    if (!inputCanvas) return;
    const img = vm?.input?.data as ImageData | undefined;
    if (!img) {
      inputCanvas.width = 1;
      inputCanvas.height = 1;
      const ctx = inputCanvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
      return;
    }
    drawImageToCanvas(inputCanvas, img);
  }

  function drawCurrent(vm: any): void {
    if (!currentCanvas) return;

    const outImg = vm?.outputImage?.data as ImageData | undefined;
    if (outImg) {
      drawImageToCanvas(currentCanvas, outImg);
      return;
    }

    const outMask = vm?.outputMask?.data as Uint8Array | undefined;
    const w = vm?.outputMask?.width as number | undefined;
    const h = vm?.outputMask?.height as number | undefined;

    if (outMask && typeof w === "number" && typeof h === "number") {
      drawMaskToCanvas(currentCanvas, outMask, w, h);
      return;
    }

    currentCanvas.width = 1;
    currentCanvas.height = 1;
    const ctx = currentCanvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
  }

  function renderStages(vm: any): void {
    if (!stagesHost) return;
    stagesHost.innerHTML = "";

    const stages = Array.isArray(vm?.stages) ? vm.stages : [];
    if (!stages.length) {
      stagesHost.appendChild(el("div", { class: "muted", style: "font-size:12px;" }, "No stages."));
      return;
    }

    const list = el("div", { style: "display:flex; flex-direction:column; gap:10px;" });

    for (const st of stages) {
      list.appendChild(renderStageVm(st));
    }

    stagesHost.appendChild(list);
  }

  function renderStageVm(st: any): HTMLElement {
    const row = el("div", { class: "card", style: "padding:10px;" });

    const head = el("div", { class: "row", style: "align-items:center; justify-content:space-between;" });
    head.appendChild(el("div", { style: "font-weight:bold;" }, String(st.title ?? st.stageId)));
    head.appendChild(el("div", { class: "status" }, String(st.state ?? "idle")));
    row.appendChild(head);

    row.appendChild(el("div", { class: "muted", style: "font-size:12px;" }, `${st.input} -> ${st.output}`));

    const stageOut = st.outputArtifact as Artifact | undefined;
    if (stageOut) {
      const canvas = el("canvas", { class: "canvas", style: "margin-top:8px;" }) as HTMLCanvasElement;
      if (isImage(stageOut)) drawImageToCanvas(canvas, stageOut.image);
      if (isMask(stageOut)) drawMaskToCanvas(canvas, stageOut.mask, stageOut.width, stageOut.height);
      row.appendChild(canvas);
    }

    const ops = Array.isArray(st.ops) ? st.ops : [];
    if (ops.length) {
      const opsWrap = el("div", { style: "margin-top:10px; display:flex; flex-direction:column; gap:8px;" });

      for (const op of ops) {
        const opRow = el("div", { class: "card", style: "padding:8px;" });

        const opHead = el("div", { class: "row", style: "align-items:center; justify-content:space-between;" });
        opHead.appendChild(el("div", { style: "font-weight:bold; font-size:12px;" }, String(op.title ?? op.opId)));
        opHead.appendChild(el("div", { class: "status" }, String(op.state ?? "idle")));
        opRow.appendChild(opHead);

        opRow.appendChild(el("div", { class: "muted", style: "font-size:12px;" }, `${op.input} -> ${op.output}`));

        const opOut = op.outputArtifact as Artifact | undefined;
        if (opOut) {
          const canvas = el("canvas", { class: "canvas", style: "margin-top:8px;" }) as HTMLCanvasElement;
          if (isImage(opOut)) drawImageToCanvas(canvas, opOut.image);
          if (isMask(opOut)) drawMaskToCanvas(canvas, opOut.mask, opOut.width, opOut.height);
          opRow.appendChild(canvas);
        }

        opsWrap.appendChild(opRow);
      }

      row.appendChild(opsWrap);
    }

    return row;
  }

  return {
    mount(): void {
      ensureMounted();
    },

    render(vm: any): void {
      ensureMounted();

      renderSelects(vm);

      statusEl.textContent = typeof vm?.statusText === "string" ? vm.statusText : "Idle";

      if (descEl) {
        const desc = typeof vm?.description === "string" ? vm.description : "Universal pipeline runner.";
        descEl.textContent = desc;
      }

      drawInput(vm);
      drawCurrent(vm);
      renderStages(vm);
    },

    dispose(): void {
      mounted = false;

      root = null;

      selectPipeline = null;
      selectRecipe = null;

      btnRunAll = null;
      btnNext = null;
      btnReset = null;

      descEl = null;

      inputCanvas = null;
      currentCanvas = null;

      stagesHost = null;

      clearHost();
    },
  };
}

