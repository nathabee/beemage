# Android Build Specification

**Project:** BeeMage — Explore image processing through visual pipelines  
**Applies to:** `apps/android-web/` (Android WebView bundle target) + integration contract with `apps/android-native/`  
**Status:** v1 — Web bundle builds and is embedded into native wrapper  
**Core principle:** Reuse `src/` unchanged by providing platform seams at build-time.

* **Document updated for version:** `0.2.2`

---

## 1. Purpose

BeeMage is implemented as a single shared application core in:

- `src/` (UI + pipelines + tuning + logging + execution orchestration)

That core is delivered through multiple runtime hosts:

- `apps/extension/` (Chrome Extension, MV3 Side Panel)
- `apps/demo/` (Static web demo, optional OpenCV)
- `apps/android-web/` (Android WebView-compatible web bundle, no OpenCV)
- `apps/android-native/` (Android wrapper embedding the bundle)

This document specifies how BeeMage supports Android by **reusing the same core code and UI** without forking `src/`.

OpenCV is intentionally excluded in the Android milestone.

---

## 2. Strategy

### 2.1 No fork of `src/`

`src/` remains the single source of truth and is reused unchanged by:

- `apps/extension/` (extension build)
- `apps/android-web/` (Android web bundle build)

### 2.2 Seam swapping (build-time)

The extension host relies on Chrome extension APIs and MV3 assumptions.
Android WebView cannot access those APIs, so the Android bundle swaps specific platform modules at bundle time.

This is the same architectural pattern as `apps/demo/`, but Android:

- does not include OpenCV
- does not swap operation implementations

### 2.3 Keep native JS op implementations

Android uses the existing pure JS processing implementations in shared code, such as:

- `src/panel/platform/opsDispatchImpl.ts` (native implementations)
- pipeline operations under `src/panel/...` (resize, threshold, morphology, svg, etc.)

No OpenCV loader, no OpenCV wasm assets, no OpenCV-backed ops in the Android build.

---

## 3. Architecture overview

Android adds a dedicated host project that runs the same panel UI and pipeline core:

```

src/                          apps/android-web/ (host)
├─ panel/*                    ├─ index.html
│  ├─ panel.html              ├─ src/main.ts
│  ├─ panel.ts                ├─ src/app.ts
│  └─ platform/*              ├─ src/mocks/*
└─ shared/*                   └─ vite.config.ts

```

### 3.1 What is reused from `src/`

- Panel UI: `src/panel/panel.ts`, `panel.html`, `panel.css`
- Tabs: `src/panel/tabs/*`
- Pipeline core: `src/panel/app/pipeline/*`
- Tuning core: `src/panel/app/tuning/*`
- Logging model: actionLog + debugTrace + console trace
- Execution ops: native JS ops in `src/panel/platform/opsDispatchImpl.ts`

### 3.2 What is replaced for Android

Android replaces only the runtime seams that are extension-specific:

- Runtime messaging + asset resolution (`src/panel/platform/runtime.ts`)
- Storage abstraction (`src/shared/platform/storage.ts`)
- Engine adapter (`src/panel/platform/engineAdapter.ts`)

---

## 4. Seam swapping: exact modules

Android swaps these modules at bundle time:

### 4.1 Runtime seam

**Original (extension / shared):**
- `src/panel/platform/runtime.ts`

**Android replacement:**
- `apps/android-web/src/mocks/runtime.ts`

Purpose:
- remove `chrome.runtime.*` dependencies
- provide an in-process event bus used by the panel
- resolve asset URLs in a static WebView-compatible environment

### 4.2 Storage seam

**Original (extension / shared):**
- `src/shared/platform/storage.ts` (extension uses chrome.storage.*)

**Android replacement:**
- `apps/android-web/src/mocks/storage.ts` (localStorage-backed)

Purpose:
- keep persistence and change notifications working without Chrome APIs

### 4.3 Engine adapter seam

**Original (shared):**
- `src/panel/platform/engineAdapter.ts`

**Android replacement:**
- `apps/android-web/src/mocks/engine/engineAdapter.ts`

Purpose:
- explicitly disable OpenCV for Android v1
- keep “engine status” UI consistent

### 4.4 What is not swapped

Android does not swap:
- `src/panel/platform/opsDispatchImpl.ts`

Therefore the Android build uses:
- the same native JS op implementations as the extension build

---

## 5. Android web host directory layout

```

apps/android-web/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ public/
│  └─ assets/pipelines/*      (synced from repo root assets/pipelines via plugin)
└─ src/
├─ main.ts
├─ app.ts
├─ mocks/
│  ├─ runtime.ts
│  ├─ storage.ts
│  └─ engine/
│     └─ engineAdapter.ts
├─ types/
│  └─ chrome-shime.d.ts
└─ vite-env.d.ts

```

---

## 6. Build pipeline

### 6.1 Install

```bash
cd apps/android-web
npm install
```

### 6.2 Build + sync into wrapper assets (recommended path)

From repo root:

```bash
./apps/android-web/scripts/build-android-web.sh
```

This builds the web bundle and copies it into:

```
apps/android-native/app/src/main/assets/
```

### 6.3 Build output (web bundle)

The Vite output is:

* `apps/android-web/dist/`

Expected contents include:

* `dist/index.html`
* `dist/app/panel.html`
* `dist/app/panel.css`
* `dist/assets/*.js`
* `dist/assets/pipelines/*.json`

---

## 7. Asset handling

### 7.1 Panel HTML/CSS

`apps/android-web/vite.config.ts` contains a plugin that:

* reads `src/panel/panel.html` and `src/panel/panel.css`
* sanitizes the HTML to remove extension bundle references
* emits them as:

  * `app/panel.html`
  * `app/panel.css`

### 7.2 Pipeline JSON files

A Vite plugin ensures pipeline examples are sourced from:

```
assets/pipelines/**/*.json
```

and copied into:

```
apps/android-web/public/assets/pipelines/
```

so they end up in:

```
apps/android-web/dist/assets/pipelines/
```

---

## 8. Execution model on Android (v1)

### 8.1 Processing

All image processing runs client-side in WebView using:

* Canvas 2D
* typed arrays
* native JS implementations in `src/`

### 8.2 Persistence

Persistence is local to the WebView context via the storage seam (localStorage-backed).

Stored data includes:

* user pipelines / recipes
* tuning overrides
* UI state (where stored)

Images are not persisted.

### 8.3 Logging

Logging channels remain separated:

* console trace (dev console only)
* debugTrace (persisted developer diagnostics)
* actionLog (user-visible audit history)

Android must preserve these semantics exactly.

---

## 9. Constraints and known gaps

### 9.1 Export UX

Browser-style downloads are weak on WebView.

v1 can ship with basic export (Blob URL / anchor download).
Future Android UX should be implemented through the runtime seam (bridge-based share/save).

### 9.2 Performance and memory

Mobile memory limits are tighter.
Future mitigations:

* limit retained intermediate artifacts
* explicit “clear outputs”
* mobile-friendly defaults (resize early)

### 9.3 OpenCV

OpenCV is disabled by design in Android v1.
If reintroduced later, it must be a separate policy with careful WebView constraints.

---

## 10. Roadmap

### v1 (current): Android web bundle + native wrapper

* `apps/android-web` builds a static WebView-compatible bundle from `src`
* seams swapped: runtime/storage/engineAdapter
* native wrapper embeds the bundle in a WebView
* no OpenCV

### v2: Native UX improvements

* Android share sheet export
* save-to-files integration
* optional camera import
* better mobile defaults

### v3 (optional): Native acceleration

* only if needed: introduce a native engine backend
* keep pipeline model and UI unchanged

---

## 11. Non-goals for Android v1

* OpenCV integration
* background services
* native image processing backend
* platform-specific UI rewrite

---

## 12. Implementation notes

* Android build must remain free of `chrome.*` usage.
* Any platform-specific feature must be routed through seams:

  * `src/panel/platform/runtime.ts`
  * `src/shared/platform/storage.ts`

No platform branching inside core modules.
