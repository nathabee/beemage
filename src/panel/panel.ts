// src/panel/panel.ts
import { getDom } from "./app/dom";
import { createBus } from "./app/bus";
import { createTabs } from "./app/tabs";
import { createPanelCache } from "./app/cache";

import { createContourTab } from "./tabs/contour/tab";
import { createSegmentationTab } from "./tabs/segmentation/tab";
import { createColorsTab } from "./tabs/colors/tab";
import { createSettingsTab } from "./tabs/settings/tab";
import { createLogsTab } from "./tabs/logs/tab";

(function boot() {
  const dom = getDom();

  const bus = createBus();
  bus.start();

  const cache = createPanelCache();

  (globalThis as any).__APP__ = {
    ...(globalThis as any).__APP__,
    cache,
  };

  const contourTab = createContourTab(dom, bus);
  const colorsTab = createColorsTab(dom, bus);
  const segmentationTab = createSegmentationTab(dom, bus);
  const settingsTab = createSettingsTab(dom, bus);
  const logsTab = createLogsTab(dom, bus);

  contourTab.bind();
  segmentationTab.bind();
  colorsTab.bind();
  settingsTab.bind();
  logsTab.bind();

  const tabs = createTabs(dom, {
    contour: contourTab,
    segmentation: segmentationTab,
    colors: colorsTab,
    settings: settingsTab,
    logs: logsTab,
  });

  tabs.bind();
  tabs.boot();
})();
