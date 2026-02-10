# Android Build Specification

**Project:** BeeMage — Explore image processing through visual pipelines
**Applies to:** `/android` (WebView wrapper target)
**Status:** v0 — Web bundle builds; native Android wrapper TBD
**Core principle:** **Reuse `/src` unchanged** by providing platform seams at build-time.

* **Document updated for version:** `0.2.0`

---

## 1. Purpose

BeeMage is implemented primarily as a **Chrome Extension (MV3, Side Panel)** built from `/src`.
This document specifies how BeeMage is extended to support an **Android app** by reusing the same core code and UI, without forking `/src`.

The Android delivery is designed as:

* **A static web bundle** built from `/src` (via Vite in `/android`)
* Later: packaged into a native Android application via a WebView-based wrapper (e.g., Capacitor or a custom WebView host)

**OpenCV is intentionally excluded in the first Android milestone.**

---

## 2. Strategy

### 2.1 No fork of `/src`

`/src` remains the single source of truth and continues to compile into:

* the Chrome Extension (`/dist` from root build)
* the Android web bundle (`/android/dist`)

### 2.2 Use seam swapping (build-time)

The extension build relies on `chrome.*` APIs and other extension runtime assumptions.
Android cannot access these APIs, so the Android build swaps specific platform modules at bundle time.

This is the same architectural pattern as `/demo`, but **Android does not bring OpenCV** and does **not** replace operation implementations.

### 2.3 Keep native JS op implementations

Android uses the existing pure JS processing implementations already present in:

* `src/panel/platform/opsDispatchImpl.ts` (native implementations)
* `src/panel/tabs/pipeline/lib/*` (resize, denoise, threshold, morphology, svg, etc.)

No OpenCV loader, no OpenCV wasm assets, no OpenCV ops variants in the Android build.

---

## 3. Architecture overview

Android delivery adds a third “host” that runs the same panel UI and pipeline core:

```
/src                      /android (host)
├─ panel/*                ├─ index.html
│  ├─ panel.html          ├─ src/main.ts
│  ├─ panel.ts            ├─ src/app.ts
│  └─ platform/*          ├─ src/mocks/*
└─ shared/*               └─ vite.config.ts
```

### 3.1 What is reused from `/src`

* Panel UI: `src/panel/panel.ts`, `panel.html`, `panel.css`
* Tabs: `src/panel/tabs/*`
* Pipeline core: `src/panel/app/pipeline/*`
* Tuning core: `src/panel/app/tuning/*`
* Logging model: actionLog + debugTrace + console trace
* Execution ops: **native JS ops** in `src/panel/platform/opsDispatchImpl.ts`

### 3.2 What is replaced for Android

Android replaces only the extension-specific runtime seams:

* Runtime messaging + asset resolution (`src/panel/platform/runtime.ts`)
* Storage abstraction (`src/shared/platform/storage.ts`)
* Engine adapter (`src/panel/platform/engineAdapter.ts`)

---

## 4. Seam swapping: exact modules

The Android build swaps these modules at bundle time:

### 4.1 Runtime seam

**Original (extension):**

* `src/panel/platform/runtime.ts`

**Android replacement:**

* `android/src/mocks/runtime.ts`

Purpose:

* remove `chrome.runtime.*` dependencies
* provide an in-process event bus used by the panel
* resolve asset URLs in a static environment via `runtimeGetAssetUrl(...)`

### 4.2 Storage seam

**Original (extension):**

* `src/shared/platform/storage.ts` (chrome.storage.local)

**Android replacement:**

* `android/src/mocks/storage.ts` (localStorage-backed)

Purpose:

* keep persistence and change notifications working without Chrome APIs

### 4.3 Engine adapter seam

**Original (extension):**

* `src/panel/platform/engineAdapter.ts` (extension stub: OpenCV unsupported)

**Android replacement:**

* `android/src/mocks/engine/engineAdapter.ts` (Android stub: OpenCV disabled)

Purpose:

* explicitly disable OpenCV for Android v1
* keep “engine status” UI consistent

### 4.4 What is *not* swapped

Android **does not** swap:

* `src/panel/platform/opsDispatchImpl.ts`

Therefore the Android build uses:

* the same native JS op implementations as the extension build

---

## 5. Android directory layout

Current Android host project layout:

```
android/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ public/
│  └─ assets/pipelines/*          (copied from repo root assets/pipelines via plugin)
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
cd android
npm install
```

### 6.2 Build

```bash
npm run build
```

Outputs:

* `android/dist/` with:

  * `dist/index.html`
  * `dist/__app/panel.html`
  * `dist/__app/panel.css`
  * `dist/assets/*.js`
  * `dist/assets/pipelines/*.json`

### 6.3 Dev server

```bash
npm run dev
```

Notes:

* `--host` is enabled so Android devices can load the dev server over LAN if needed.
* No Chrome APIs are used; the build stays web-compatible.

---

## 7. Asset handling

### 7.1 Panel HTML/CSS

`vite.config.ts` contains a plugin (`panelAssetsPlugin`) that:

* reads `src/panel/panel.html` and `src/panel/panel.css`
* sanitizes the HTML to remove extension bundle references
* emits them into the Android bundle as:

  * `__app/panel.html`
  * `__app/panel.css`

The Android host boot code loads these assets and boots the panel.

### 7.2 Pipeline JSON files

`vite.config.ts` contains a plugin (`ensurePipelinesPublicPlugin`) that:

* copies repo root pipeline assets from:

  * `assets/pipelines/**/*.json`
* into:

  * `android/public/assets/pipelines/`

So they are included in `android/dist/assets/pipelines/` at build.

---

## 8. Execution model on Android (v1)

### 8.1 Processing

All image processing runs client-side in the WebView using:

* Canvas 2D
* Typed arrays
* Native JS implementations in `/src`

### 8.2 Persistence

Persistence is local to the WebView context using `localStorage` (via storage mock).

Stored data includes:

* user pipelines / recipes
* tuning overrides
* UI preferences (if stored)

Images are not persisted unless explicitly implemented (not planned for v1).

### 8.3 Logging

Logging model is unchanged:

* console trace (dev only)
* debugTrace (persisted dev diagnostics)
* actionLog (user-visible audit history)

The Android build must preserve the separation between these channels.

---

## 9. Constraints and known gaps

### 9.1 “Download” UX

Browser “download” flows are weak on mobile WebView.
Android v1 may ship with basic export (Blob URL / anchor download) but should plan for:

* Share sheet integration
* Save-to-files integration

This should be implemented via the runtime seam (future `runtimeShare(...)`, `runtimeSaveFile(...)`).

### 9.2 Performance and memory

Mobile devices have tighter memory limits than desktop Chrome.
Pipelines that keep many intermediate artifacts can cause GC pressure.

Mitigations (future work):

* limit stored intermediate frames
* explicit “clear pipeline outputs”
* lower default resize thresholds on mobile

### 9.3 OpenCV

OpenCV is disabled by design in v1.
If OpenCV is reintroduced later, it should be done as a separate engine policy with careful WebView constraints.

---

## 10. Roadmap

### v0 (now): Android web bundle

* `/android` builds a static bundle from `/src`
* seams swapped: runtime/storage/engineAdapter
* ops implementations are native JS only

### v1: Package as Android APK

* Wrap `android/dist` into a WebView app

  * Capacitor or custom WebView
* Ensure file import works reliably
* Implement export/share using Android-native APIs (through a JS bridge)

### v2: Mobile UX improvements

* Better export/save flows
* Optional camera import
* Performance tuning defaults for mobile

### v3 (optional): Native acceleration

* Only if needed: introduce a native processing backend (NDK) as an additional “engine”
* Keep the pipeline model and UI unchanged

---

## 11. Non-goals for the Android v1 milestone

* OpenCV integration
* Full offline asset updates beyond bundling
* Native image processing backend
* Background processing / services

---

## 12. Implementation notes

* Android build must remain **free of `chrome.*` runtime usage**.
* Any new platform-dependent feature must be routed through:

  * `src/panel/platform/runtime.ts` (seam)
  * or `src/shared/platform/storage.ts` (seam)

No direct platform branching inside core modules.

--- 