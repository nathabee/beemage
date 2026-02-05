// src/panel/panel.ts
import { getDom } from "./app/dom";
import { createBus } from "./app/bus";
import { createTabs } from "./app/tabs";
import { createPanelCache } from "./app/cache";

import { createContourTab } from "./tabs/contour/tab"; 
import { createColorsTab } from "./tabs/colors/tab";
import { createSettingsTab } from "./tabs/settings/tab";
import { createLogsTab } from "./tabs/logs/tab";
import { createTuningController } from "./app/tuning/controller";
import { createPipelineTab } from "./tabs/pipeline/tab";

import * as actionLog from "../shared/actionLog";
import * as debugTrace from "../shared/debugTrace";

import { ensureDevConfigLoaded } from "../shared/devConfigStore";

async function boot(): Promise<void> {
  const dom = getDom();

  await ensureDevConfigLoaded().catch(() => null);

  const bus = createBus();
  bus.start();

  const cache = createPanelCache();

  (globalThis as any).__APP__ = {
    ...(globalThis as any).__APP__,
    cache,
  };

  const tuning = createTuningController({
    getRuntimeAvailability: () => ({ opencvReady: false }),

    debugTraceAppend: (message) =>
      debugTrace.append({
        scope: "panel",
        kind: "debug",
        message,
      }),

    actionLogAppend: (message) =>
      actionLog.append({
        scope: "panel",
        kind: "info",
        message,
      }),
  });

  tuning.mount({ mountEl: dom.tuningMountEl, scopeRootId: "app" }); 

  const contourTab = createContourTab(dom, bus);
  const colorsTab = createColorsTab(dom, bus); 
  const pipelineTab = createPipelineTab(dom, bus, tuning);
  const settingsTab = createSettingsTab(dom, bus);
  const logsTab = createLogsTab(dom, bus);

  contourTab.bind(); 
  pipelineTab.bind();
  colorsTab.bind();
  settingsTab.bind();
  logsTab.bind();

  const tabs = createTabs(dom, {
    contour: contourTab, 
    pipeline: pipelineTab,
    colors: colorsTab,
    settings: settingsTab,
    logs: logsTab,
  });

  tabs.bind();
  tabs.boot();
}

void boot();
