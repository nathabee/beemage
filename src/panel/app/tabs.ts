// src/panel/app/tabs.ts
import type { Dom } from "./dom";

export type TabId = "settings" | "logs";

export type Tab = {
  id: TabId;
  mount(): void;
  unmount(): void;
};

export function createTabs(dom: Dom, tabs: Record<TabId, Tab>) {
  let active: TabId = "settings";

  function setTabUI(next: TabId) {
    const is = (id: TabId) => next === id;

    dom.tabSettings.classList.toggle("is-active", is("settings"));
    dom.tabSettings.setAttribute("aria-selected", String(is("settings")));
    dom.viewSettings.hidden = !is("settings");

    dom.tabLogs.classList.toggle("is-active", is("logs"));
    dom.tabLogs.setAttribute("aria-selected", String(is("logs")));
    dom.viewLogs.hidden = !is("logs");
  }

  function switchTo(next: TabId) {
    if (next === active) return;
    tabs[active].unmount();
    active = next;
    setTabUI(active);
    tabs[active].mount();
  }

  function bind() {
    dom.tabSettings.addEventListener("click", () => switchTo("settings"));
    dom.tabLogs.addEventListener("click", () => switchTo("logs"));
  }

  function boot() {
    setTabUI(active);
    tabs[active].mount();
  }

  return { bind, boot, switchTo };
}
