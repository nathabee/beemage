// src/panel/app/state.ts
import type { Dom } from "./dom";

let busyCount = 0;

export function getBusy(): boolean {
  return busyCount > 0;
}

export async function withBusy<T>(dom: Dom, fn: () => Promise<T>): Promise<T> {
  beginBusy(dom);
  try {
    return await fn();
  } finally {
    endBusy(dom);
  }
}

export function setBusy(dom: Dom, next: boolean): void {
  if (next) {
    beginBusy(dom);
    return;
  }
  busyCount = 0;
  applyBusy(dom, false);
}

function beginBusy(dom: Dom): void {
  busyCount++;
  if (busyCount === 1) applyBusy(dom, true);
}

function endBusy(dom: Dom): void {
  busyCount--;
  if (busyCount <= 0) {
    busyCount = 0;
    applyBusy(dom, false);
    return;
  }
  if (busyCount === 0) applyBusy(dom, false);
}

function applyBusy(dom: Dom, next: boolean): void {
  dom.rootEl.classList.toggle("is-busy", next);

  // Allow toggling visibility even while busy (so you can escape Logs if needed)
  dom.cfgShowDevToolsEl.disabled = false;

  // Settings (dev config)
  dom.cfgTraceConsoleEl.disabled = next;
  dom.cfgActionLogMaxEl.disabled = next;
  dom.cfgDebugTraceMaxEl.disabled = next;
  dom.cfgFailureLogsPerRunEl.disabled = next;
  dom.btnCfgResetDefaults.disabled = next;

  // Debug enabled toggle lives in Settings
  dom.logsCbDebugEl.disabled = next;

  // Logs tab controls
  dom.logsLimitEl.disabled = next;
  dom.btnLogsRefresh.disabled = next;
  dom.logsTrimKeepEl.disabled = next;
  dom.btnLogsTrim.disabled = next;
  dom.btnLogsExport.disabled = next;
  dom.btnLogsClear.disabled = next;

  dom.debugLimitEl.disabled = next;
  dom.btnDebugRefresh.disabled = next;
  dom.btnDebugExport.disabled = next;
  dom.btnDebugClear.disabled = next;
}
