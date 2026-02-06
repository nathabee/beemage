// src/panel/tabs/builder/model.ts
import type { PipelineDef } from "../../app/pipeline/type";
import { loadUserPipelines, saveUserPipelines } from "../../app/pipeline/userPipelineStore";

export type BuilderExportFile = {
  format: "beemage.pipeline.userPipelines.v1";
  exportedAt: string; // ISO
  pipelines: PipelineDef[];
};

export type BuilderImportResult = {
  imported: number;
  skipped: number;
  totalInFile: number;
};

export type BuilderModel = {
  listUserPipelines(): Promise<PipelineDef[]>;
  importFromJsonText(jsonText: string): Promise<BuilderImportResult>;
  exportToJsonText(): Promise<string>;
};

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

function isPipelineDef(x: unknown): x is PipelineDef {
  if (!isObject(x)) return false;

  if (typeof (x as any).id !== "string" || !(x as any).id) return false;
  if (typeof (x as any).title !== "string" || !(x as any).title) return false;
  if (typeof (x as any).implemented !== "boolean") return false;
  if (!Array.isArray((x as any).ops)) return false;

  for (const op of (x as any).ops) {
    if (!isObject(op)) return false;
    if (typeof (op as any).instanceId !== "string" || !(op as any).instanceId) return false;
    if (typeof (op as any).opId !== "string" || !(op as any).opId) return false;
    if ((op as any).enabled !== undefined && typeof (op as any).enabled !== "boolean") return false;
  }

  return true;
}

export function createBuilderModel(): BuilderModel {
  async function listUserPipelines(): Promise<PipelineDef[]> {
    return await loadUserPipelines().catch(() => []);
  }

  async function importFromJsonText(jsonText: string): Promise<BuilderImportResult> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("Invalid JSON (parse failed).");
    }

    // Accept:
    // A) { format, pipelines: [...] } (preferred)
    // B) [...] (raw PipelineDef[])
    let pipelinesRaw: unknown;

    if (Array.isArray(parsed)) {
      pipelinesRaw = parsed;
    } else if (isObject(parsed) && Array.isArray((parsed as any).pipelines)) {
      pipelinesRaw = (parsed as any).pipelines;
    } else {
      throw new Error('Invalid file shape. Expected {"pipelines":[...]} or an array of pipelines.');
    }

    const incoming = pipelinesRaw as unknown[];
    const totalInFile = incoming.length;

    const valid: PipelineDef[] = [];
    let skipped = 0;

    for (const p of incoming) {
      if (!isPipelineDef(p)) {
        skipped++;
        continue;
      }
      valid.push(p);
    }

    if (valid.length === 0) {
      throw new Error("No valid pipelines found in the imported file.");
    }

    // Merge by id: imported pipelines override existing ones.
    const existing = await loadUserPipelines().catch(() => []);
    const byId = new Map<string, PipelineDef>();
    for (const p of existing) byId.set(p.id, p);
    for (const p of valid) byId.set(p.id, p);

    await saveUserPipelines(Array.from(byId.values()));

    return { imported: valid.length, skipped, totalInFile };
  }

  async function exportToJsonText(): Promise<string> {
    const pipelines = await loadUserPipelines().catch(() => []);
    const file: BuilderExportFile = {
      format: "beemage.pipeline.userPipelines.v1",
      exportedAt: new Date().toISOString(),
      pipelines,
    };
    return JSON.stringify(file, null, 2);
  }

  return { listUserPipelines, importFromJsonText, exportToJsonText };
}
