// src/panel/tabs/builder/view.ts 
import type { Dom } from "../../app/dom";
import type { OpSpec, PipelineDef, ArtifactType } from "../../app/pipeline/type";
import { createOperationCard } from "../../app/pipeline/ui/operationCard"; 
import { createPipelineManagementCard } from "../../app/pipeline/ui/pipelineManagementCard";


export type BuilderRowVm = {
  id: string;
  title: string;
  implemented: boolean;
  opCount: number;
};

export type BuilderVm = {
  statusText: string;

  pipelines: BuilderRowVm[];

  ops: ReadonlyArray<OpSpec>;

  userPipelinesRaw: ReadonlyArray<PipelineDef>;

  // NEW: all recipes keyed by pipelineId
  recipesAll: Record<string, any>;
};


export type BuilderViewHandlers = {
  onImportFile: (file: File) => Promise<void>;
  onExport: () => Promise<void>;

  // NEW: pipeline management
  onDeletePipeline: (pipelineId: string) => Promise<void>;
  onUpsertPipeline: (p: PipelineDef) => Promise<void>;

  // NEW: recipe management
  onSelectRecipe: (pipelineId: string, recipeId: string) => Promise<void>;
  onUpsertRecipe: (pipelineId: string, recipe: any) => Promise<void>;
  onDeleteRecipe: (pipelineId: string, recipeId: string) => Promise<void>;
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


  // Filters (default = all)
  let filterInput: ArtifactType | "all" = "all";
  let filterOutput: ArtifactType | "all" = "all";


  // Filter controls
  let selFilterInput: HTMLSelectElement | null = null;
  let selFilterOutput: HTMLSelectElement | null = null;


  // Pipeline name/id filter (stored pipelines board)
  let pipelineQuery = "";
  let inpPipelineQuery: HTMLInputElement | null = null;

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



  function renderOps(ops: ReadonlyArray<OpSpec>, vm?: BuilderVm): void {
    const m = ensureOpsMount();
    m.innerHTML = "";

    const card = el("div", { class: "card", style: "padding:10px;" });
    card.appendChild(el("div", { class: "cardTitle" }, "All operations"));

    // Controls row: IO filters (ONLY for operations)
    const controls = el("div", {
      class: "row",
      style: "align-items:center; gap:10px; flex-wrap:wrap; margin-top:10px;",
    });

    const lblIn = el("label", { class: "fieldInline" });
    lblIn.appendChild(el("span", {}, "Filter input"));
    selFilterInput = buildTypeSelect(String(filterInput), (v) => {
      filterInput = (v === "all" ? "all" : (v as any));
      // re-render ops only
      renderOps(ops, vm);
    });
    lblIn.appendChild(selFilterInput);

    const lblOut = el("label", { class: "fieldInline" });
    lblOut.appendChild(el("span", {}, "Filter output"));
    selFilterOutput = buildTypeSelect(String(filterOutput), (v) => {
      filterOutput = (v === "all" ? "all" : (v as any));
      // re-render ops only
      renderOps(ops, vm);
    });
    lblOut.appendChild(selFilterOutput);

    controls.appendChild(lblIn);
    controls.appendChild(lblOut);
    card.appendChild(controls);

    const filtered = ops.filter(passesFilter);

    if (!filtered.length) {
      card.appendChild(
        el("div", { class: "muted", style: "font-size:12px; margin-top:10px;" }, "No operations match the filter."),
      );
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


 
  function renderList(_pipelines: BuilderRowVm[], vm: BuilderVm): void {
    const m = ensureListMount();
    m.innerHTML = "";

    const card = el("div", { class: "card", style: "padding:10px;" });
    card.appendChild(el("div", { class: "cardTitle" }, "Stored user pipelines"));

    // Controls row: pipeline name/id filter
    const controls = el("div", {
      class: "row",
      style: "align-items:center; gap:10px; flex-wrap:wrap; margin-top:10px;",
    });

    const lblQuery = el("label", { class: "fieldInline" });
    lblQuery.appendChild(el("span", {}, "Filter pipelines"));

    inpPipelineQuery = el("input", {
      type: "text",
      value: pipelineQuery,
      placeholder: "Search by id or title…",
      style: "min-width:260px;",
    }) as HTMLInputElement;

    inpPipelineQuery.addEventListener("input", () => {
      pipelineQuery = inpPipelineQuery ? inpPipelineQuery.value : "";
      renderList(vm.pipelines, vm);
    });

    lblQuery.appendChild(inpPipelineQuery);

    const btnClear = el("button", { type: "button", class: "btn", style: "padding:4px 10px; font-size:12px;" }, "Clear");
    btnClear.addEventListener("click", () => {
      pipelineQuery = "";
      if (inpPipelineQuery) inpPipelineQuery.value = "";
      renderList(vm.pipelines, vm);
    });

    controls.appendChild(lblQuery);
    controls.appendChild(btnClear);
    card.appendChild(controls);

    // Management board
    const rawPipes = Array.isArray(vm.userPipelinesRaw) ? vm.userPipelinesRaw : [];
    if (!rawPipes.length) {
      card.appendChild(
        el("div", { class: "muted", style: "font-size:12px; margin-top:10px;" }, "No user pipelines stored."),
      );
      m.appendChild(card);
      return;
    }

    const q = pipelineQuery.trim().toLowerCase();
    const filteredPipes =
      q.length === 0
        ? rawPipes
        : rawPipes.filter((p) => {
            const id = String(p.id ?? "").toLowerCase();
            const title = String(p.title ?? "").toLowerCase();
            return id.includes(q) || title.includes(q);
          });

    if (!filteredPipes.length) {
      card.appendChild(
        el("div", { class: "muted", style: "font-size:12px; margin-top:10px;" }, "No pipelines match the search."),
      );
      m.appendChild(card);
      return;
    }

    const board = el("div", {
      style: "margin-top:10px; display:flex; flex-direction:column; gap:10px;",
    }) as HTMLDivElement;

    const allRecipes = (vm.recipesAll ?? {}) as any;

    for (const pDef of filteredPipes) {
      const st = allRecipes?.[pDef.id] ?? { recipesById: {}, selectedRecipeId: undefined };
      const recipesById = st?.recipesById ?? {};
      const recipes = Object.values(recipesById) as any[];
      const selectedRecipeId = st?.selectedRecipeId as string | undefined;

      board.appendChild(
        createPipelineManagementCard({
          pipeline: pDef,
          opsLibrary: vm.ops ?? [],
          selectedRecipeId,
          recipes,
          handlers: {
            onDeletePipeline: handlers.onDeletePipeline,
            onUpsertPipeline: handlers.onUpsertPipeline,
            onSelectRecipe: handlers.onSelectRecipe,
            onUpsertRecipe: handlers.onUpsertRecipe,
            onDeleteRecipe: handlers.onDeleteRecipe,
          },
        }),
      );
    }

    card.appendChild(board);
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
    ensureOpsMount();
  }


  function render(vm: BuilderVm): void {
    dom.builderStatusEl.textContent = vm.statusText || "Idle";

    renderList(vm.pipelines, vm);
    renderOps(vm.ops ?? [], vm);
  }


  function dispose(): void {
    mounted = false;
    bound = false;
    selectedFile = null;

    filterInput = "all";
    filterOutput = "all";
    pipelineQuery = "";
    inpPipelineQuery = null;

    selFilterInput = null;
    selFilterOutput = null;

    if (listMountEl) {
      listMountEl.innerHTML = "";
      listMountEl.remove();
      listMountEl = null;
    }

    if (opsMountEl) {
      opsMountEl.innerHTML = "";
      opsMountEl.remove();
      opsMountEl = null;
    }
  }




  return { bind, mount, render, dispose };
}
