// src/panel/app/tuning/controller.ts
import { createTuningModel, type TuningModel, type TuningNodeVm, type TuningTreeVm } from "./model";
import { createTuningView, type TuningView } from "./view";
import type { ComponentId, EnginePolicy, ParamValue, RuntimeEngineAvailability } from "./types";

type Mount = {
  mountEl: HTMLElement;
  scopeRootId: ComponentId; // "app" for Settings, "contour" for Contour
  view: TuningView;
};

export type TuningControllerDeps = {
  // Runtime availability should be read from your engine/injection state.
  // Keep it as a function so it’s always fresh.
  getRuntimeAvailability: () => RuntimeEngineAvailability;

  // Logging channels: debugTrace for persisted dev, actionLog for user-visible.
  // NOTE: these should already be wrapped to match your entry object types.
  debugTraceAppend: (line: string) => void;
  actionLogAppend: (line: string) => void;
};

export type TuningController = {
  mount(args: { mountEl: HTMLElement; scopeRootId: ComponentId }): void;
  unmount(mountEl: HTMLElement): void;
  refresh(): Promise<void>;
  dispose(): void;
};

function pickSubtreeRootVm(root: TuningNodeVm, scopeRootId: ComponentId): TuningNodeVm {
  if (root.id === scopeRootId) return root;

  const stack: TuningNodeVm[] = [...(root.children ?? [])];
  while (stack.length > 0) {
    const n = stack.shift()!;
    if (n.id === scopeRootId) return n;
    for (const ch of n.children ?? []) stack.push(ch);
  }

  throw new Error(`[tuning] scopeRootId not found in VM tree: ${scopeRootId}`);
}

export function createTuningController(deps: TuningControllerDeps): TuningController {
  const model: TuningModel = createTuningModel({
    getRuntimeAvailability: deps.getRuntimeAvailability,
  });

  const mounts: Mount[] = [];
  let disposed = false;

  async function computeAppTree(): Promise<TuningTreeVm> {
    // One full load; then we can slice subtrees for scoped mounts.
    return await model.loadTree("app");
  }

  async function rerenderAll() {
    if (disposed) return;

    const appTree = await computeAppTree();

    for (const m of mounts) {
      if (m.scopeRootId === "app") {
        m.view.render(appTree);
        continue;
      }

      const scopedRoot = pickSubtreeRootVm(appTree.root, m.scopeRootId);

      // Keep runtime + stored consistent; only swap root + scopeId
      m.view.render({
        ...appTree,
        scopeId: m.scopeRootId,
        root: scopedRoot,
      });
    }
  }

  async function setPolicy(id: ComponentId, policy: EnginePolicy) {
    await model.setEnginePolicy(id, policy);

    deps.actionLogAppend(`[tuning] policy ${id} = ${policy}`);
    deps.debugTraceAppend(`[tuning] setPolicy id=${id} policy=${policy}`);

    await rerenderAll();
  }

  async function setParam(id: ComponentId, key: string, value: ParamValue) {
    await model.setParam(id, key, value);

    deps.actionLogAppend(`[tuning] param ${id}.${key} = ${String(value)}`);
    deps.debugTraceAppend(`[tuning] setParam id=${id} key=${key} value=${String(value)}`);

    await rerenderAll();
  }

  async function resetNode(id: ComponentId) {
    await model.resetNode(id);

    deps.actionLogAppend(`[tuning] reset node ${id}`);
    deps.debugTraceAppend(`[tuning] resetNode id=${id}`);

    await rerenderAll();
  }

  async function resetParam(id: ComponentId, key: string) {
    await model.resetParam(id, key);

    deps.actionLogAppend(`[tuning] reset param ${id}.${key}`);
    deps.debugTraceAppend(`[tuning] resetParam id=${id} key=${key}`);

    await rerenderAll();
  }

  function mount(args: { mountEl: HTMLElement; scopeRootId: ComponentId }) {
    if (disposed) return;

    const { mountEl, scopeRootId } = args;

    if (mounts.some((m) => m.mountEl === mountEl)) return;

    const view = createTuningView(mountEl, {
      onSetPolicy: setPolicy,
      onSetParam: setParam,
      onResetNode: resetNode,
      onResetParam: resetParam,
    });

    mounts.push({ mountEl, scopeRootId, view });

    void rerenderAll();
  }

  function unmount(mountEl: HTMLElement) {
    const idx = mounts.findIndex((m) => m.mountEl === mountEl);
    if (idx < 0) return;

    mounts[idx].view.dispose();
    mounts.splice(idx, 1);
  }

  async function refresh() {
    await rerenderAll();
  }

  function dispose() {
    disposed = true;
    for (const m of mounts) m.view.dispose();
    mounts.length = 0;
  }

  return { mount, unmount, refresh, dispose };
}
