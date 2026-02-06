// src/panel/tabs/builder/view.ts
import type { Dom } from "../../app/dom";

export type BuilderRowVm = {
  id: string;
  title: string;
  implemented: boolean;
  opCount: number;
};

export type BuilderVm = {
  statusText: string;
  pipelines: BuilderRowVm[];
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

  // We render into this mount (created once inside viewBuilder).
  let listMountEl: HTMLDivElement | null = null;

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

  function renderList(pipelines: BuilderRowVm[]): void {
    const m = ensureListMount();
    m.innerHTML = "";

    const card = el("div", { class: "card", style: "padding:10px;" });
    card.appendChild(el("div", { class: "cardTitle" }, "Stored user pipelines"));

    if (!pipelines.length) {
      card.appendChild(el("div", { class: "muted", style: "font-size:12px;" }, "No user pipelines stored."));
      m.appendChild(card);
      return;
    }

    const ul = el("ul", { style: "margin:0; padding-left:18px;" }) as HTMLUListElement;

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
  }

  function render(vm: BuilderVm): void {
    dom.builderStatusEl.textContent = vm.statusText || "Idle";
    renderList(vm.pipelines);
  }

  function dispose(): void {
    mounted = false;
    bound = false;
    selectedFile = null;
    clearListMount();
    listMountEl?.remove();
    listMountEl = null;
  }

  return { bind, mount, render, dispose };
}
