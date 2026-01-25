// src/panel/tabs/settings/tab.ts

import * as actionLog from "../../../shared/actionLog";
import * as debugTrace from "../../../shared/debugTrace";

import type { Dom } from "../../app/dom";
import type { createBus } from "../../app/bus";
import { clampInt } from "../../app/format";
import { getBusy } from "../../app/state";
import { storageGet, storageSet } from "../../../shared/platform/storage";

import {
  ensureDevConfigLoaded,
  getDevConfigSnapshot,
  setDevConfig,
  resetDevConfigDefaults,
  DEV_CONFIG_DEFAULTS,
  type DevConfig as StoredDevConfig,
} from "../../../shared/devConfigStore";

import { createSettingsModel, type SettingsDevConfig } from "./model";
import { createSettingsView } from "./view";

type Bus = ReturnType<typeof createBus>;
 
const SHOW_DEV_TOOLS_KEY = "template.settings.showDevTools"; // boolean in storage

function getManifestVersion(): string {
  try {
    const rt: any = (globalThis as any)?.chrome?.runtime;
    const m = rt?.getManifest?.();
    const v = typeof m?.version === "string" ? m.version : "";
    if (v) return v;
  } catch {
    // ignore
  }
  return "";
}

function toSettingsDevConfig(s: StoredDevConfig): SettingsDevConfig {
  return {
    traceConsole: !!s.traceConsole,
    actionLogMax: Number(s.actionLogMax ?? DEV_CONFIG_DEFAULTS.actionLogMax),
    debugTraceMax: Number(s.debugTraceMax ?? DEV_CONFIG_DEFAULTS.debugTraceMax),
    failureLogsPerRun: Number(s.failureLogsPerRun ?? DEV_CONFIG_DEFAULTS.failureLogsPerRun),
  };
}

function toStoredDevConfigFromInputs(dom: Dom): StoredDevConfig {
  return {
    traceConsole: !!dom.cfgTraceConsoleEl.checked,

    actionLogMax: clampInt(dom.cfgActionLogMaxEl.value, 100, 50000, DEV_CONFIG_DEFAULTS.actionLogMax),
    debugTraceMax: clampInt(dom.cfgDebugTraceMaxEl.value, 100, 50000, DEV_CONFIG_DEFAULTS.debugTraceMax),
    failureLogsPerRun: clampInt(dom.cfgFailureLogsPerRunEl.value, 0, 50000, DEV_CONFIG_DEFAULTS.failureLogsPerRun),
  };
}

async function setDebugEnabled(enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  const any = debugTrace as any;
  if (typeof any.setEnabled === "function") {
    await any.setEnabled(enabled);
    return { ok: true };
  }
  if (typeof any.enable === "function" && typeof any.disable === "function") {
    await (enabled ? any.enable() : any.disable());
    return { ok: true };
  }
  return { ok: false, error: "debugTrace has no setEnabled/enable/disable API." };
}

export function createSettingsTab(dom: Dom, bus: Bus) {
  const model = createSettingsModel();
  const view = createSettingsView(dom);

  async function loadShowDevToolsPref(): Promise<boolean> {
    const res = await storageGet([SHOW_DEV_TOOLS_KEY]).catch(() => ({} as any));
    return (res as any)?.[SHOW_DEV_TOOLS_KEY] === true;
  }

  async function saveShowDevToolsPref(v: boolean) {
    await storageSet({ [SHOW_DEV_TOOLS_KEY]: !!v }).catch(() => null);
  }

  function applyDevToolsVisibility(show: boolean) {
    model.setShowDevTools(show);
    view.setShowDevToolsChecked(show);
    view.setDevToolsVisible(show);

    // If Logs are active and are now hidden, force Settings.
    if (!show) dom.tabSettings.click();
  }

  async function initDevToolsVisibility() {
    const showDevTools = await loadShowDevToolsPref();
    applyDevToolsVisibility(showDevTools);

    void debugTrace.append({
      scope: "settings",
      kind: "debug",
      message: "boot:applyDevToolsVisibility",
      meta: { showDevTools },
    });
  }

  async function loadAll() {
    view.setBusy(getBusy());

    // Dev tools visibility
    const showDevTools = await loadShowDevToolsPref();
    applyDevToolsVisibility(showDevTools);

    // Dev config
    await ensureDevConfigLoaded().catch(() => null);
    const devSnap = getDevConfigSnapshot();
    model.setDev(toSettingsDevConfig(devSnap));
    view.setDevConfig(model.dev);

    // Debug enabled state
    const dbgAny = debugTrace as any;
    const enabled = typeof dbgAny.isEnabled === "function" ? !!dbgAny.isEnabled() : !!dbgAny.enabled;

    model.setDebugEnabled(enabled);
    view.setDebugEnabledChecked(enabled);

    // About
    view.setAbout(getManifestVersion() || "—", dom.settingsGitHubLinkEl?.href || "#");

    view.setGeneralStatus("");
    view.setDevStatus("");
  }

  async function onToggleShowDevTools() {
    const checked = !!dom.cfgShowDevToolsEl.checked;

    applyDevToolsVisibility(checked);
    await saveShowDevToolsPref(checked);

    void actionLog.append({
      kind: "run",
      scope: "settings",
      message: checked ? "Developer tools enabled (Logs visible)." : "Developer tools disabled (Logs hidden).",
      ok: true,
      meta: { showDevTools: checked },
    });

    void debugTrace.append({
      scope: "settings",
      kind: "debug",
      message: "ui:toggle showDevTools",
      meta: { showDevTools: checked },
    });

    view.setGeneralStatus(checked ? "Developer tools enabled." : "Developer tools disabled.");
    setTimeout(() => view.setGeneralStatus(""), 1200);
  }

  async function onApplyDevConfigFromInputs() {
    const next = toStoredDevConfigFromInputs(dom);

    view.setDevStatus("Saving…");

    await setDevConfig(next);

    model.setDev(toSettingsDevConfig(next));
    view.setDevConfig(model.dev);

    void actionLog.append({
      kind: "run",
      scope: "settings",
      message: "Developer configuration updated.",
      ok: true,
      meta: next,
    });

    void debugTrace.append({
      scope: "settings",
      kind: "debug",
      message: "devConfig:updated",
      meta: next,
    });

    view.setDevStatus("Saved.");
    setTimeout(() => view.setDevStatus(""), 1200);
  }

  async function onResetDevDefaults() {
    view.setDevStatus("Resetting…");

    // 1) Reset stored dev config
    await resetDevConfigDefaults();
    await ensureDevConfigLoaded().catch(() => null);

    const snap = getDevConfigSnapshot();
    model.setDev(toSettingsDevConfig(snap));
    view.setDevConfig(model.dev);

    // 2) Reset debugTrace enabled (separate store!)
    const dbgRes = await setDebugEnabled(false);
    if (dbgRes.ok) {
      model.setDebugEnabled(false);
      view.setDebugEnabledChecked(false);
    } else {
      void actionLog.append({
        kind: "error",
        scope: "settings",
        message: "Dev defaults reset, but failed to reset debug enabled state.",
        ok: false,
        error: dbgRes.error || "unknown error",
      });
    }

    void actionLog.append({
      kind: "run",
      scope: "settings",
      message: "Developer configuration reset to defaults (debug disabled).",
      ok: true,
      meta: { ...DEV_CONFIG_DEFAULTS, debugEnabled: false },
    });

    view.setDevStatus("Reset.");
    setTimeout(() => view.setDevStatus(""), 1200);
  }

  async function onToggleDebugEnabled() {
    const checked = !!dom.logsCbDebugEl.checked;

    view.setDevStatus("Saving…");

    const res = await setDebugEnabled(checked);
    if (!res.ok) {
      dom.logsCbDebugEl.checked = !checked;
      view.setDevStatus(`Save failed: ${res.error || "unknown error"}`);

      void actionLog.append({
        kind: "error",
        scope: "settings",
        message: "Failed to change debug trace enabled state.",
        ok: false,
        error: res.error || "unknown error",
        meta: { enabled: checked },
      });
      return;
    }

    model.setDebugEnabled(checked);

    void actionLog.append({
      kind: "run",
      scope: "settings",
      message: checked ? "Debug trace enabled." : "Debug trace disabled (debug traces cleared).",
      ok: true,
      meta: { enabled: checked },
    });

    void debugTrace.append({
      scope: "settings",
      kind: "debug",
      message: "debugTrace:enabledChanged",
      meta: { enabled: checked },
    });

    view.setDevStatus("Saved.");
    setTimeout(() => view.setDevStatus(""), 1200);
  }

  const off = bus.on(() => {
    // template has no background events
  });


  function bind() {
    dom.cfgShowDevToolsEl.addEventListener("change", () => {
      void onToggleShowDevTools();
    });

    // Developer config inputs
    dom.cfgTraceConsoleEl.addEventListener("change", () => {
      if (getBusy()) return;
      void onApplyDevConfigFromInputs();
    });

    dom.cfgActionLogMaxEl.addEventListener("change", () => {
      if (getBusy()) return;
      void onApplyDevConfigFromInputs();
    });

    dom.cfgDebugTraceMaxEl.addEventListener("change", () => {
      if (getBusy()) return;
      void onApplyDevConfigFromInputs();
    });

    dom.cfgFailureLogsPerRunEl.addEventListener("change", () => {
      if (getBusy()) return;
      void onApplyDevConfigFromInputs();
    });

    dom.btnCfgResetDefaults.addEventListener("click", () => {
      if (getBusy()) return;
      void onResetDevDefaults();
    });

    // Debug enabled toggle (lives in Settings in the minimal template)
    dom.logsCbDebugEl.addEventListener("change", () => {
      if (getBusy()) return;
      void onToggleDebugEnabled();
    });

    // Apply Logs visibility at startup (even if Settings tab isn’t mounted yet)
    void initDevToolsVisibility().catch(() => null);
  }

  return {
    id: "settings" as const,
    refresh() {
      void loadAll().catch(() => null);
    },
    mount() {
      void loadAll().catch(() => null);
    },
    unmount() { },
    bind,
    dispose() {
      off();
    },
  };
}
