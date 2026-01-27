// src/panel/app/tabs.ts
import type { Dom } from "./dom";

type TabKey = "contour" | "colors" | "settings" | "logs";

type TabApi = {
  bind(): void;

  // Optional lifecycle hooks (some tabs may not implement them)
  mount?: () => void;
  unmount?: () => void;
  refresh?: () => void;

  // Legacy hook (kept for compatibility)
  boot?: () => void;

  // Optional cleanup
  dispose?: () => void;
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

  let active: TabKey = "contour";
  const mounted = new Set<TabKey>();

  function setActiveView(key: TabKey) {
    (Object.keys(tabButtons) as TabKey[]).forEach((k) => {
      const isActive = k === key;
      tabButtons[k].classList.toggle("is-active", isActive);
      tabButtons[k].setAttribute("aria-selected", isActive ? "true" : "false");

      views[k].hidden = !isActive;
      views[k].classList.toggle("is-active", isActive);
    });
  }

  function activate(next: TabKey) {
    if (next === active) {
      // Re-selecting current tab -> refresh if available
      tabs[next].refresh?.();
      return;
    }

    // Leaving current tab
    tabs[active].unmount?.();

    active = next;

    // Update UI first (so tab content is visible before heavy work)
    setActiveView(active);

    // First time mount vs subsequent refresh
    if (!mounted.has(active)) {
      mounted.add(active);
      tabs[active].mount?.();
    } else {
      tabs[active].refresh?.();
    }
  }

  function bind() {
    tabButtons.contour.addEventListener("click", (e) => {
      e.preventDefault?.();
      activate("contour");
    });

    tabButtons.colors.addEventListener("click", (e) => {
      e.preventDefault?.();
      activate("colors");
    });

    tabButtons.settings.addEventListener("click", (e) => {
      e.preventDefault?.();
      activate("settings");
    });

    tabButtons.logs.addEventListener("click", (e) => {
      e.preventDefault?.();
      activate("logs");
    });
  }

  function boot() {
    // Default tab
    active = "contour";
    setActiveView(active);

    // Keep legacy "boot" hook for any tab that expects it
    (Object.keys(tabs) as TabKey[]).forEach((k) => tabs[k].boot?.());

    // Also call mount for the initial tab (if provided)
    if (!mounted.has(active)) {
      mounted.add(active);
      tabs[active].mount?.();
    } else {
      tabs[active].refresh?.();
    }
  }

  function dispose() {
    (Object.keys(tabs) as TabKey[]).forEach((k) => tabs[k].dispose?.());
  }

  return { bind, boot, activate, dispose };
}
