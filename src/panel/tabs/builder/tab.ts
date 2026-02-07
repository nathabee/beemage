// src/panel/tabs/builder/tab.ts
import type { Dom } from "../../app/dom";
import type { Bus } from "../../app/bus";

import { createBuilderModel } from "./model";
import { createBuilderView } from "./view";

import * as actionLog from "../../../shared/actionLog";
import * as debugTrace from "../../../shared/debugTrace";

function downloadJson(filename: string, jsonText: string): void {
  const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function createBuilderTab(dom: Dom, _bus: Bus) {
  const model = createBuilderModel();

  let mounted = false;
 
  // Cached VM source
  let statusText = "Idle";
  let cachedPipes = [] as Array<{ id: string; title: string; implemented: boolean; ops: unknown[] }>;
  let cachedOps = model.listOperations();

  const view = createBuilderView({
    dom,
    handlers: {
      onImportFile: async (file: File) => {
        try {
          statusText = `Importing: ${file.name}`;
          render();

          const text = await file.text();
          const res = await model.importFromJsonText(text);

          actionLog.append({
            scope: "panel",
            kind: "info",
            message: `Builder import: imported=${res.imported}, skipped=${res.skipped}, total=${res.totalInFile}`,
          });

          statusText = `Imported ${res.imported} pipeline(s) (skipped ${res.skipped}).`;

          await refreshList();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);

          actionLog.append({
            scope: "panel",
            kind: "error",
            message: `Builder import failed: ${msg}`,
          });

          debugTrace.append({
            scope: "panel",
            kind: "error",
            message: "Builder import failed",
            meta: { error: msg },
          });

          statusText = `Import failed: ${msg}`;
          render();
        }
      },

      onExport: async () => {
        try {
          statusText = "Exporting…";
          render();

          const jsonText = await model.exportToJsonText();
          downloadJson("beemage-user-pipelines.json", jsonText);

          actionLog.append({
            scope: "panel",
            kind: "info",
            message: "Builder export: downloaded beemage-user-pipelines.json",
          });

          statusText = "Exported.";
          render();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);

          actionLog.append({
            scope: "panel",
            kind: "error",
            message: `Builder export failed: ${msg}`,
          });

          debugTrace.append({
            scope: "panel",
            kind: "error",
            message: "Builder export failed",
            meta: { error: msg },
          });

          statusText = `Export failed: ${msg}`;
          render();
        }
      },
    },
  });

  async function refreshList(): Promise<void> {
    const pipes = await model.listUserPipelines().catch(() => []);
    cachedPipes = pipes as any;

    // ops come from the global catalogue; stable, but we refresh anyway (cheap + future-proof)
    cachedOps = model.listOperations();

    statusText = `Ready. User pipelines: ${pipes.length} · Operations: ${cachedOps.length}`;
    render();
  }


  function getVm() {
    const raw = (cachedPipes ?? []) as any[];

    return {
      statusText,
      pipelines: raw.map((p: any) => ({
        id: String(p.id),
        title: String(p.title),
        implemented: !!p.implemented,
        opCount: Array.isArray(p.ops) ? p.ops.length : 0,
      })),
      // NEW: full defs for pipelineCard
      userPipelinesRaw: raw,
      // already added earlier:
      ops: cachedOps,
    };
  }



  function render(): void {
    view.mount();
    view.render(getVm());
  }

  function bind(): void {
    view.bind();
    dom.builderStatusEl.textContent = "Idle";
  }

  async function mount(): Promise<void> {
    mounted = true;
    statusText = "Loading…";
    render();

    await refreshList();
  }

  async function refresh(): Promise<void> {
    if (!mounted) return;
    statusText = "Refreshing…";
    render();

    await refreshList();
  }

  function unmount(): void {
    mounted = false;
  }

  function dispose(): void {
    view.dispose();
  }

  return { bind, mount, refresh, unmount, dispose };
}
