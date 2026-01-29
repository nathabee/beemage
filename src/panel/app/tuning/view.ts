// src/panel/app/tuning/view.ts

import type { ComponentId, EnginePolicy, ParamSchema, ParamValue } from "./types";
import type { TuningNodeVm, TuningTreeVm } from "./model";

export type TuningViewHandlers = {
  onSetPolicy: (id: ComponentId, policy: EnginePolicy) => Promise<void> | void;
  onSetParam: (id: ComponentId, key: string, value: ParamValue) => Promise<void> | void;
  onResetNode?: (id: ComponentId) => Promise<void> | void;
  onResetParam?: (id: ComponentId, key: string) => Promise<void> | void;
};

export type TuningView = {
  render(tree: TuningTreeVm): void;
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

function clear(node: HTMLElement) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function engineBadgeText(n: TuningNodeVm): string {
  if (n.fallbackReason) return `${n.effectiveEngine} (fallback)`;
  return n.effectiveEngine;
}

function policyOptions(isRoot: boolean): Array<{ value: EnginePolicy; label: string }> {
  const base: Array<{ value: EnginePolicy; label: string }> = [
    { value: "native", label: "Native" },
    { value: "auto", label: "Auto" },
    { value: "opencv", label: "OpenCV" },
  ];
  return isRoot ? base : [{ value: "inherit", label: "Inherit" }, ...base];
}

function isParamOverride(
  n: TuningNodeVm,
  key: string,
  effectiveValue: ParamValue,
): boolean {
  const stored = n.storedParams?.[key];
  return typeof stored !== "undefined" && stored !== effectiveValue;
}

function renderParamInput(args: {
  node: TuningNodeVm;
  compId: ComponentId;
  key: string;
  schema: ParamSchema;
  value: ParamValue;
  handlers: TuningViewHandlers;
}): HTMLElement {
  const { node, compId, key, schema, value, handlers } = args;

  const row = el("div", { class: "row", style: "align-items:center; gap:10px; flex-wrap:wrap;" });

  const label = el("label", { class: "fieldInline" });
  const name = el("span", undefined, schema.label);
  label.appendChild(name);

  let input: HTMLInputElement;

  if (schema.kind === "number") {
    input = el("input") as HTMLInputElement;
    input.type = "number";
    if (typeof schema.min === "number") input.min = String(schema.min);
    if (typeof schema.max === "number") input.max = String(schema.max);
    if (typeof schema.step === "number") input.step = String(schema.step);
    input.value = String(value ?? schema.default);

    input.addEventListener("change", () => {
      const n = Number(input.value);
      void handlers.onSetParam(compId, key, Number.isFinite(n) ? n : schema.default);
    });
  } else if (schema.kind === "boolean") {
    input = el("input") as HTMLInputElement;
    input.type = "checkbox";
    input.checked = Boolean(value);

    input.addEventListener("change", () => {
      void handlers.onSetParam(compId, key, !!input.checked);
    });
  } else {
    input = el("input") as HTMLInputElement;
    input.type = "text";
    input.value = String(value ?? schema.default);

    input.addEventListener("change", () => {
      void handlers.onSetParam(compId, key, String(input.value ?? schema.default));
    });
  }

  label.appendChild(input);
  row.appendChild(label);

  // Reset param (only if provided + override exists)
  if (handlers.onResetParam && typeof node.storedParams?.[key] !== "undefined") {
    const btn = el("button", { type: "button" }, "Reset");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      void handlers.onResetParam?.(compId, key);
    });
    row.appendChild(btn);
  }

  // Small hint for overrides
  if (isParamOverride(node, key, value)) {
    row.appendChild(el("span", { class: "muted", style: "font-size:12px;" }, "override"));
  }

  return row;
}

function renderNode(args: {
  node: TuningNodeVm;
  depth: number;
  isRoot: boolean;
  handlers: TuningViewHandlers;
}): HTMLElement {
  const { node, depth, isRoot, handlers } = args;

  const wrap = el("div", {
    style: `margin-left:${Math.min(depth * 14, 56)}px; margin-top:10px;`,
  });

  const box = el("div", {
    style:
      "border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px; background:rgba(0,0,0,0.12);",
  });

  // Header row
  const head = el("div", { class: "row", style: "align-items:center; justify-content:space-between; gap:10px;" });

  const titleWrap = el("div");
  titleWrap.appendChild(el("div", { style: "font-weight:700;" }, node.title));
  if (node.description) titleWrap.appendChild(el("div", { class: "muted", style: "font-size:12px; margin-top:2px;" }, node.description));
  if (node.isGroup) titleWrap.appendChild(el("div", { class: "muted", style: "font-size:12px; margin-top:2px;" }, "Group (policy affects children)"));

  head.appendChild(titleWrap);

  const right = el("div", { class: "row", style: "align-items:center; gap:10px;" });

  // Effective engine badge
  right.appendChild(el("span", { class: "qBadge" }, engineBadgeText(node)));

  // Policy select
  const sel = el("select") as HTMLSelectElement;
  sel.style.background = "rgba(255,255,255,0.05)";
  sel.style.border = "1px solid rgba(255,255,255,0.08)";
  sel.style.color = "rgba(255,255,255,0.92)";
  sel.style.borderRadius = "10px";
  sel.style.padding = "6px 8px";

  const opts = policyOptions(isRoot);
  for (const o of opts) {
    const opt = el("option") as HTMLOptionElement;
    opt.value = o.value;
    opt.textContent = o.label;

    // If the component cannot implement OpenCV, disable "OpenCV" choice.
    if (o.value === "opencv" && !node.canImplementOpenCv) opt.disabled = true;

    sel.appendChild(opt);
  }

  // Use effective policy for display (keeps UI consistent with inheritance resolution)
  sel.value = node.effectivePolicy;

  sel.addEventListener("change", () => {
    void handlers.onSetPolicy(node.id, sel.value as EnginePolicy);
  });

  right.appendChild(sel);

  // Reset node button
  const hasAnyOverride =
    typeof node.storedPolicy !== "undefined" ||
    (node.storedParams && Object.keys(node.storedParams).length > 0);

  if (handlers.onResetNode && hasAnyOverride) {
    const btnReset = el("button", { type: "button" }, "Reset node");
    btnReset.addEventListener("click", (e) => {
      e.preventDefault();
      void handlers.onResetNode?.(node.id);
    });
    right.appendChild(btnReset);
  }

  head.appendChild(right);
  box.appendChild(head);

  // Fallback / runtime notes
  if (node.fallbackReason) {
    box.appendChild(
      el("div", { class: "muted", style: "margin-top:8px; font-size:12px; line-height:1.4;" }, node.fallbackReason),
    );
  } else if (node.effectivePolicy === "opencv" && !node.runtimeOpenCvReady) {
    box.appendChild(
      el(
        "div",
        { class: "muted", style: "margin-top:8px; font-size:12px; line-height:1.4;" },
        "OpenCV policy selected, but OpenCV is not available at runtime. It will fall back to native.",
      ),
    );
  }

  // Params
  const paramKeys = Object.keys(node.paramsSchema ?? {});
  if (paramKeys.length > 0) {
    const paramsBox = el("div", { style: "margin-top:10px;" });
    paramsBox.appendChild(el("div", { class: "muted", style: "font-weight:600; margin-bottom:6px;" }, "Parameters"));

    for (const key of paramKeys) {
      const schema = node.paramsSchema[key];
      const value = node.effectiveParams[key];
      paramsBox.appendChild(
        renderParamInput({
          node,
          compId: node.id,
          key,
          schema,
          value,
          handlers,
        }),
      );
    }

    box.appendChild(paramsBox);
  }

  // Children
  if (node.children.length > 0) {
    const kids = el("div", { style: "margin-top:10px;" });
    for (const ch of node.children) {
      kids.appendChild(
        renderNode({
          node: ch,
          depth: depth + 1,
          isRoot: false,
          handlers,
        }),
      );
    }
    box.appendChild(kids);
  }

  wrap.appendChild(box);
  return wrap;
}

export function createTuningView(mountEl: HTMLElement, handlers: TuningViewHandlers): TuningView {
  let disposed = false;

  function render(tree: TuningTreeVm) {
    if (disposed) return;
    clear(mountEl);

    const treatAsAbsoluteRoot = tree.scopeId === "app";

    // Header
    const top = el("div", { class: "row", style: "align-items:center; justify-content:space-between; gap:10px;" });
    top.appendChild(el("div", { style: "font-weight:700;" }, "Tuning"));
    top.appendChild(
      el(
        "div",
        { class: "muted", style: "font-size:12px;" },
        `OpenCV runtime: ${tree.runtime.opencvReady ? "ready" : "not available"}`,
      ),
    );
    mountEl.appendChild(top);

    // Root node
    mountEl.appendChild(
      renderNode({
        node: tree.root,
        depth: 0,
        isRoot: treatAsAbsoluteRoot,
        handlers,
      }),
    );
  }

  function dispose() {
    disposed = true;
    clear(mountEl);
  }

  return { render, dispose };
}
