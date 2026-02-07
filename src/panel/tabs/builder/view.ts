// src/panel/tabs/builder/view.ts 
import type { Dom } from "../../app/dom";
import type { OpSpec, PipelineDef, ArtifactType } from "../../app/pipeline/type";
import { createOperationCard } from "../../app/pipeline/ui/operationCard";
import { createPipelineCard } from "../../app/pipeline/ui/pipelineCard";


export type BuilderRowVm = {
  id: string;
  title: string;
  implemented: boolean;
  opCount: number;
};

export type BuilderVm = {
  statusText: string;

  // existing summary list
  pipelines: BuilderRowVm[];

  // NEW: ops library to display/filter
  ops: ReadonlyArray<OpSpec>;

  // NEW: full pipeline defs for selection + pipelineCard
  userPipelinesRaw: ReadonlyArray<PipelineDef>;
};



export type BuilderViewHandlers = {
  onImportFile: (file: File) => Promise<void>;
  onExport: () => Promise<void>;
};

export type BuilderView = {
  bind(): void;
  mount(): void;
  render(vm: BuilderVm): void;
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

export function createBuilderView(args: { dom: Dom; handlers: BuilderViewHandlers }): BuilderView {
  const { dom, handlers } = args;

  let mounted = false;
  let bound = false;

  let pipelineMountEl: HTMLDivElement | null = null;

  // Filters (default = all)
  let filterInput: ArtifactType | "all" = "all";
  let filterOutput: ArtifactType | "all" = "all";

  // Selected pipeline id (for pipelineCard)
  let selectedPipelineId: string | null = null;

  // Filter controls
  let selFilterInput: HTMLSelectElement | null = null;
  let selFilterOutput: HTMLSelectElement | null = null;
  let selPipeline: HTMLSelectElement | null = null;


  // We render into this mount (created once inside viewBuilder).
  let listMountEl: HTMLDivElement | null = null;
  // Ops grid mount
  let opsMountEl: HTMLDivElement | null = null;


  // Track current selected file.
  let selectedFile: File | null = null;

  function ensureListMount(): HTMLDivElement {
    if (listMountEl) return listMountEl;

    // Create a stable mount at the end of the builder view.
    const m = el("div", { "data-role": "builderListMount", style: "margin-top:12px;" }) as HTMLDivElement;
    dom.viewBuilder.appendChild(m);
    listMountEl = m;
    return m;
  }

  function clearListMount(): void {
    if (!listMountEl) return;
    listMountEl.innerHTML = "";
  }

  function ensurePipelineMount(): HTMLDivElement {
    if (pipelineMountEl) return pipelineMountEl;
    const m = el("div", { "data-role": "builderPipelineMount", style: "margin-top:12px;" }) as HTMLDivElement;
    dom.viewBuilder.appendChild(m);
    pipelineMountEl = m;
    return m;
  }

  function clearPipelineMount(): void {
    if (!pipelineMountEl) return;
    pipelineMountEl.innerHTML = "";
  }

  function ensureOpsMount(): HTMLDivElement {
    if (opsMountEl) return opsMountEl;
    const m = el("div", { "data-role": "builderOpsMount", style: "margin-top:12px;" }) as HTMLDivElement;
    dom.viewBuilder.appendChild(m);
    opsMountEl = m;
    return m;
  }

  function clearOpsMount(): void {
    if (!opsMountEl) return;
    opsMountEl.innerHTML = "";
  }

  function buildTypeSelect(current: string, onChange: (v: string) => void): HTMLSelectElement {
    const s = el("select") as HTMLSelectElement;

    const options: Array<{ value: string; label: string }> = [
      { value: "all", label: "All" },
      { value: "image", label: "image" },
      { value: "mask", label: "mask" },
      { value: "svg", label: "svg" },
    ];

    for (const o of options) {
      const opt = el("option") as HTMLOptionElement;
      opt.value = o.value;
      opt.textContent = o.label;
      if (o.value === current) opt.selected = true;
      s.appendChild(opt);
    }

    s.addEventListener("change", () => onChange(s.value));
    return s;
  }

 

 

    function passesFilter(op: OpSpec): boolean {
    const inOk = filterInput === "all" ? true : op.io.input === filterInput;
    const outOk = filterOutput === "all" ? true : op.io.output === filterOutput;
    return inOk && outOk;
  }

  function renderPipelinePreview(vm: BuilderVm): void {
    const m = ensurePipelineMount();
    m.innerHTML = "";

    if (!selectedPipelineId) {
      // no preview
      return;
    }

    const pipes = Array.isArray(vm.userPipelinesRaw) ? vm.userPipelinesRaw : [];
    const p = pipes.find((x) => x.id === selectedPipelineId);
    if (!p) return;

    const card = el("div", { class: "card", style: "padding:10px;" });
    card.appendChild(el("div", { class: "cardTitle" }, "Pipeline preview"));

    card.appendChild(
      createPipelineCard(p, vm.ops ?? [], {
        showId: true,
        showDescription: true,
        showImplementationFlag: true,
        showConnectors: true,
        showDisabledOps: true,
        compactOps: true,
      }),
    );

    m.appendChild(card);
  }

  function renderOps(ops: ReadonlyArray<OpSpec>): void {
    const m = ensureOpsMount();
    m.innerHTML = "";

    const card = el("div", { class: "card", style: "padding:10px;" });
    card.appendChild(el("div", { class: "cardTitle" }, "All operations"));

    const filtered = ops.filter(passesFilter);

    if (!filtered.length) {
      card.appendChild(el("div", { class: "muted", style: "font-size:12px;" }, "No operations match the filter."));
      m.appendChild(card);
      return;
    }

    const grid = el("div", { class: "opsGrid", style: "margin-top:10px;" }) as HTMLDivElement;

    for (const op of filtered) {
      grid.appendChild(
        createOperationCard(op, {
          compact: true,
          showGroup: true,
          showId: true,
        }),
      );
    }

    card.appendChild(grid);
    m.appendChild(card);
  }


  function renderList(pipelines: BuilderRowVm[], vm: BuilderVm): void {
    const m = ensureListMount();
    m.innerHTML = "";

    const card = el("div", { class: "card", style: "padding:10px;" });
    card.appendChild(el("div", { class: "cardTitle" }, "Stored user pipelines"));

    // Controls row: pipeline select + filters
    const controls = el("div", { class: "row", style: "align-items:center; gap:10px; flex-wrap:wrap; margin-top:10px;" });

    const lblPipe = el("label", { class: "fieldInline" });
    lblPipe.appendChild(el("span", {}, "Preview pipeline"));
    selPipeline = el("select") as HTMLSelectElement;
    lblPipe.appendChild(selPipeline);

    // Populate pipeline select from raw defs (not summary)
    const raw = Array.isArray(vm.userPipelinesRaw) ? vm.userPipelinesRaw : [];
    selPipeline.innerHTML = "";
    {
      const optNone = el("option") as HTMLOptionElement;
      optNone.value = "";
      optNone.textContent = "None";
      selPipeline.appendChild(optNone);

      for (const p of raw) {
        const opt = el("option") as HTMLOptionElement;
        opt.value = p.id;
        opt.textContent = `${p.title} (${p.id})`;
        selPipeline.appendChild(opt);
      }
    }

    // Keep selection stable
    if (selectedPipelineId && raw.some((p) => p.id === selectedPipelineId)) {
      selPipeline.value = selectedPipelineId;
    } else {
      selPipeline.value = "";
      selectedPipelineId = null;
    }

    selPipeline.addEventListener("change", () => {
      const v = selPipeline ? selPipeline.value : "";
      selectedPipelineId = v || null;
      // re-render pipeline preview only (cheap to re-render everything too)
      renderPipelinePreview(vm);
    });

    const lblIn = el("label", { class: "fieldInline" });
    lblIn.appendChild(el("span", {}, "Filter input"));
    selFilterInput = buildTypeSelect(String(filterInput), (v) => {
      filterInput = (v === "all" ? "all" : (v as any));
      renderOps(vm.ops ?? []);
    });
    lblIn.appendChild(selFilterInput);

    const lblOut = el("label", { class: "fieldInline" });
    lblOut.appendChild(el("span", {}, "Filter output"));
    selFilterOutput = buildTypeSelect(String(filterOutput), (v) => {
      filterOutput = (v === "all" ? "all" : (v as any));
      renderOps(vm.ops ?? []);
    });
    lblOut.appendChild(selFilterOutput);

    controls.appendChild(lblPipe);
    controls.appendChild(lblIn);
    controls.appendChild(lblOut);

    card.appendChild(controls);

    // Summary list
    if (!pipelines.length) {
      card.appendChild(el("div", { class: "muted", style: "font-size:12px; margin-top:10px;" }, "No user pipelines stored."));
      m.appendChild(card);
      return;
    }

    const ul = el("ul", { style: "margin:10px 0 0 0; padding-left:18px;" }) as HTMLUListElement;

    for (const p of pipelines) {
      ul.appendChild(
        el(
          "li",
          { style: "font-size:12px; margin:4px 0;" },
          `${p.id} — ${p.title} (${p.implemented ? "implemented" : "not implemented"}, ops=${p.opCount})`,
        ),
      );
    }

    card.appendChild(ul);
    m.appendChild(card);
  }


  function bind(): void {
    if (bound) return;
    bound = true;

    // Import file picker
    dom.builderImportFileEl.addEventListener("change", () => {
      selectedFile = dom.builderImportFileEl.files?.[0] ?? null;
    });

    // Export button
    dom.btnBuilderExportEl.addEventListener("click", () => {
      void handlers.onExport();
    });

    // Optional: import immediately on file select (simple UX, zero extra button)
    dom.builderImportFileEl.addEventListener("change", () => {
      const f = dom.builderImportFileEl.files?.[0] ?? null;
      if (!f) return;
      void handlers.onImportFile(f);
      // reset picker to allow re-importing same file without reloading page
      dom.builderImportFileEl.value = "";
      selectedFile = null;
    });
  }

  function mount(): void {
    if (mounted) return;
    mounted = true;
    ensureListMount();
    ensurePipelineMount();
    ensureOpsMount();
  }


  function render(vm: BuilderVm): void {
    dom.builderStatusEl.textContent = vm.statusText || "Idle";

    renderList(vm.pipelines, vm);
    renderPipelinePreview(vm);
    renderOps(vm.ops ?? []);
  }

  function dispose(): void {
    mounted = false;
    bound = false;
    selectedFile = null;

    selectedPipelineId = null;
    filterInput = "all";
    filterOutput = "all";

    selFilterInput = null;
    selFilterOutput = null;
    selPipeline = null;

    clearListMount();
    listMountEl?.remove();
    listMountEl = null;

    clearPipelineMount();
    pipelineMountEl?.remove();
    pipelineMountEl = null;

    clearOpsMount();
    opsMountEl?.remove();
    opsMountEl = null;
  }



  return { bind, mount, render, dispose };
}
