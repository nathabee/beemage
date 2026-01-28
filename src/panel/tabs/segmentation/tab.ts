// src/panel/tabs/segmentation/tab.ts
import type { Dom } from "../../app/dom";
import type { createBus } from "../../app/bus";
import { logTrace } from "../../app/log";

import { createSegmentationModel } from "./model";
import { createSegmentationView } from "./view";

type Bus = ReturnType<typeof createBus>;

export function createSegmentationTab(dom: Dom, _bus: Bus) {
  const model = createSegmentationModel();
  const view = createSegmentationView(dom);

  function bind() {
    // Placeholder: no actions yet.
  }

  function mount() {
    logTrace("[segmentation] mount (placeholder)");
    model.status = "Idle";
    view.set(model);
  }

  function refresh() {
    logTrace("[segmentation] refresh (placeholder)");
    view.set(model);
  }

  function unmount() {}
  function dispose() {}

  return { bind, mount, refresh, unmount, dispose };
}
