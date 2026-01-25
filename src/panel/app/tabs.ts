// src/panel/app/tabs.ts
import type { Dom } from "./dom";

type TabKey = "contour" | "colors" | "settings" | "logs";

type TabApi = {
  bind(): void;
  boot?: () => void;
};

type TabsMap = Record<TabKey, TabApi>;

export function createTabs(dom: Dom, tabs: TabsMap) {
  const tabButtons: Record<TabKey, HTMLButtonElement> = {
    contour: dom.tabContour,
    colors: dom.tabColors,
    settings: dom.tabSettings,
    logs: dom.tabLogs,
  };

  const views: Record<TabKey, HTMLElement> = {
    contour: dom.viewContour,
    colors: dom.viewColors,
    settings: dom.viewSettings,
    logs: dom.viewLogs,
  };

  function setActive(key: TabKey) {
    (Object.keys(tabButtons) as TabKey[]).forEach((k) => {
      const active = k === key;
      tabButtons[k].classList.toggle("is-active", active);
      tabButtons[k].setAttribute("aria-selected", active ? "true" : "false");

      // hide/show views
      views[k].hidden = !active;
      views[k].classList.toggle("is-active", active);
    });
  }

  function bind() {
    tabButtons.contour.addEventListener("click", () => setActive("contour"));
    tabButtons.colors.addEventListener("click", () => setActive("colors"));
    tabButtons.settings.addEventListener("click", () => setActive("settings"));
    tabButtons.logs.addEventListener("click", () => setActive("logs"));
  }

  function boot() {
    // Default tab
    setActive("contour");

    // If any tab needs a boot hook, run it
    (Object.keys(tabs) as TabKey[]).forEach((k) => tabs[k].boot?.());
  }

  return { bind, boot };
}
