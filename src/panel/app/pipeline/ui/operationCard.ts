// src/panel/app/pipeline/ui/operationCard.ts

import type { OpSpec } from "../type";
import type { OperationUi, OperationPort, PortType } from "./type";

export type OperationCardOptions = {
  compact?: boolean;
  showId?: boolean;
  showGroup?: boolean;

  /**
   * Map a port type to a CSS modifier class (without leading dot).
   * Default mapping is opPort--image / --mask / --svg / --unknown.
   */
  getPortClass?: (type: PortType) => string;

  onClick?: (opId: string) => void;
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

function normalizeOpToUi(op: OpSpec): OperationUi {
  // Today: single input/output in op.io. Tomorrow: extend here.
  const inputs: OperationPort[] = [{ kind: "input", type: op.io.input }];
  const outputs: OperationPort[] = [{ kind: "output", type: op.io.output }];

  return {
    id: op.id,
    title: op.title,
    group: (op as any).group,
    inputs,
    outputs,
  };
}

function defaultPortClass(type: PortType): string {
  const t = String(type || "").toLowerCase();
  if (t === "image") return "opPort--image";
  if (t === "mask") return "opPort--mask";
  if (t === "svg") return "opPort--svg";
  return "opPort--unknown";
}

function renderPortsRow(args: {
  ports: OperationPort[];
  kind: "input" | "output";
  getPortClass: (type: PortType) => string;
}): HTMLElement {
  const { ports, kind, getPortClass } = args;

  const row = el("div", { class: "opCard__portsRow" });

  const label = el("div", { class: "opCard__portsLabel" }, kind === "input" ? "IN" : "OUT");
  row.appendChild(label);

  const portsWrap = el("div", { class: "opCard__ports" });

  for (const p of ports) {
    const cls = `opPort ${getPortClass(p.type)}`;
    const text = p.label ? `${p.label}: ${p.type}` : String(p.type);

    const chip = el("div", { class: cls, "data-port-kind": p.kind, "data-port-type": String(p.type) }, text);
    portsWrap.appendChild(chip);
  }

  row.appendChild(portsWrap);
  return row;
}

/**
 * Shared UI component:
 * - Used in Builder (list of operations)
 * - Used in Pipeline (display of steps)
 * - Multi-port ready via OperationUi normalization
 */
export function createOperationCard(op: OpSpec, opts?: OperationCardOptions): HTMLElement {
  const ui = normalizeOpToUi(op);

  const options: Required<OperationCardOptions> = {
    compact: !!opts?.compact,
    showId: opts?.showId ?? true,
    showGroup: opts?.showGroup ?? true,
    getPortClass: opts?.getPortClass ?? defaultPortClass,
    onClick: opts?.onClick ?? (() => undefined),
  };

  const root = el("div", {
    class: `opCard${options.compact ? " opCard--compact" : ""}`,
    "data-op-id": ui.id,
  });

  const head = el("div", { class: "opCard__head" });

  const title = el("div", { class: "opCard__title" }, ui.title);
  head.appendChild(title);

  const meta = el("div", { class: "opCard__meta" });

  if (options.showGroup && ui.group) {
    meta.appendChild(el("span", { class: "opBadge opBadge--group" }, ui.group));
  }

  if (options.showId) {
    meta.appendChild(el("span", { class: "opBadge opBadge--id" }, ui.id));
  }

  head.appendChild(meta);
  root.appendChild(head);

  // Ports
  const body = el("div", { class: "opCard__body" });

  body.appendChild(
    renderPortsRow({
      ports: ui.inputs,
      kind: "input",
      getPortClass: options.getPortClass,
    }),
  );

  body.appendChild(
    renderPortsRow({
      ports: ui.outputs,
      kind: "output",
      getPortClass: options.getPortClass,
    }),
  );

  root.appendChild(body);

  // Clickable
  if (opts?.onClick) {
    root.classList.add("opCard--clickable");
    root.addEventListener("click", (ev) => {
      ev.preventDefault?.();
      opts.onClick?.(ui.id);
    });
  }

  return root;
}
