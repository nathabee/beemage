
# Architecture

**BeeMage — Explore image processing through visual pipelines**

* **Document updated for version:** `0.2.2`

This document describes the **architecture of BeeMage**, its **shared core**, and its **delivery-specific runtimes**.

BeeMage is built around a single, delivery-agnostic application core that is executed in multiple hosts (web, extension, Android WebView).

---

## 1. Repository path map

BeeMage is a **multi-delivery** project:

* `/src/`
  Shared application core. This is the single source of truth for UI, pipelines, typing, tuning, logs.

* `/apps/demo/`
  Web demo host (Vite). Builds a static bundle for GitHub Pages and local preview. Uses seam swapping.

* `/apps/extension/`
  Chrome Extension host (MV3). Packages the shared panel into a side panel extension build.

* `/apps/android-web/`
  Android-targeted web bundle host (Vite). Builds a static bundle compatible with WebView (no Chrome APIs).

* `/apps/android-native/`
  Android Studio / Gradle wrapper. Embeds the Android web bundle into a WebView and produces APK/AAB.

* `/assets/`
  Shared static inputs for builds (example pipelines, icons, etc.).

* `/docs/`
  GitHub Pages site, including `docs/demo/` (published web demo).

* `/release/`
  Release artifacts produced by build scripts (ZIP/APK/AAB).

---

## 2. Architectural overview

BeeMage consists of three layers:

1. **Application Core** (shared)
2. **Platform / Runtime Seams**
3. **Delivery Hosts** (`/apps/*`)

All image processing happens **locally**.
There is no backend and no remote processing.

---

## 3. Application core (shared)

The application core is identical across all deliveries.

It provides:

* the full UI
* the pipeline system
* tuning, storage, and logs
* execution orchestration

### Core properties

* **Pipeline-based execution**
* **Typed artifacts** (`image`, `mask`, `svg`)
* **Explicit execution model**
* **Inspectable intermediate results**
* **Local persistence**

---

## 4. High-level core architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         Application UI                          │
│               src/panel/panel.html + panel.ts                   │
│                                                               │
│  Tabs: Image | Pipeline | Builder | Colors | Settings | Logs   │
│                                                               │
│  - tab modules (src/panel/tabs/*)                              │
│  - in-memory artifacts and previews                            │
│  - user-triggered downloads                                    │
└───────────────────────────────┬───────────────────────────────┘
                                │ uses
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                 Pipeline and Tuning Core                        │
│   src/panel/app/pipeline/*     src/panel/app/tuning/*           │
│                                                               │
│  - pipeline catalogue and typing                               │
│  - pipeline runner                                             │
│  - user pipelines and recipes                                  │
│  - tuning registry, presets, stored overrides                  │
└───────────────────────────────┬───────────────────────────────┘
                                │ dispatch through seams
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                  Platform / Execution Seams                     │
│                 src/panel/platform/*                            │
│                                                               │
│  - opsDispatch (facade + core)                                 │
│  - engineAdapter                                               │
│  - runtime abstraction                                         │
└───────────────────────────────┬───────────────────────────────┘
                                │ persistence & logs
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    Shared Services                              │
│                        src/shared/*                             │
│                                                               │
│  - storage abstraction                                         │
│  - action log                                                  │
│  - debug trace                                                 │
│  - dev configuration store                                     │
└───────────────────────────────────────────────────────────────┘
```

---

## 5. Core modules and responsibilities

### `src/panel/` — UI and application logic

* `panel.html`, `panel.css`, `panel.ts`
  UI entry point and layout.

* `app/dom.ts`
  Typed DOM bindings.

* `app/tabs.ts`
  Tab lifecycle and routing.

* `app/state.ts`, `app/cache.ts`
  Shared state and caches.

* `app/pipeline/*`
  Pipeline catalogue, typing rules, runner, stores.

* `app/tuning/*`
  Parameter registry, presets, persistence, UI bindings.

### `src/panel/tabs/*` — UI tabs

Each tab follows a uniform structure:

* `tab.ts` — lifecycle and wiring
* `model.ts` — state and operations
* `view.ts` — rendering

Tabs:

* **Image** — image loading and preview
* **Pipeline** — pipeline execution and previews
* **Builder** — pipeline construction and management
* **Colors** — region-based coloring
* **Settings** — configuration and runtime status
* **Logs** — action log and debug trace

### `src/panel/platform/*` — execution abstraction

This layer isolates runtime differences.

* `opsDispatch.ts`
  Public dispatch facade.

* `opsDispatchCore.ts`
  Engine resolution and parameter binding.

* `opsDispatchImpl.ts`
  Native execution implementations.

* `engineAdapter.ts`
  Engine availability and policy resolution.

* `runtime.ts`
  Runtime abstraction (asset resolution, message bridge).

### `src/shared/*` — shared services

* `shared/platform/storage.ts`
  Storage abstraction.

* `actionLog.ts`
  User-visible audit history.

* `debugTrace.ts`
  Persisted developer diagnostics.

* `devConfigStore.ts`
  Development flags and limits.

---

## 6. Delivery formats

BeeMage runs the same application core (`/src`) in multiple delivery hosts (`/apps/*`).

All deliveries share:

* the panel UI (`src/panel/*`)
* the pipeline core (`src/panel/app/pipeline/*`)
* typed artifacts (`image`, `mask`, `svg`)
* tuning, logs, and persistence abstractions (`src/shared/*`)

Differences are handled via platform seams and build-time module swapping.

---

### 6.1 Web demo (apps/demo)

**Purpose:** browser-based demo + experimentation environment (local dev + GitHub Pages).

Characteristics:

* standard web runtime (no extension APIs)
* seam swapping for:

  * runtime abstraction
  * storage abstraction
  * engine adapter
  * ops dispatch implementation for demo-only execution strategies
* optional OpenCV (WASM) for comparison and exploration

Outputs:

* build output: `apps/demo/dist/`
* published site: `docs/demo/` (GitHub Pages)

---

### 6.2 Chrome extension (apps/extension)

**Purpose:** MV3 Side Panel delivery for Chrome.

Characteristics:

* side panel host (manifest `side_panel.default_path`)
* minimal permissions (`storage`, `sidePanel`)
* native TypeScript execution only (OpenCV disabled)
* extension-specific entrypoints live in `apps/extension/src/*`
* shared UI entrypoint stays in `src/panel/panel.ts`

Outputs:

* unpacked build folder: `apps/extension/dist/`
* release ZIP: `release/beemage-<version>.zip`

---

### 6.3 Android (apps/android-web + apps/android-native)

Android is intentionally split:

1. **Android web bundle** (`apps/android-web`)
   A Vite host that builds a static bundle compatible with Android WebView and swaps platform seams (no Chrome APIs, no OpenCV).

2. **Android native wrapper** (`apps/android-native`)
   A Gradle/Android Studio project that embeds the bundle into a WebView, serves assets via `WebViewAssetLoader`, and enforces Android-specific security posture.

The wrapper consumes exactly this copied asset tree:

```
apps/android-native/app/src/main/assets/
```

No business logic lives in the wrapper layer (v1).

Outputs:

* web bundle: `apps/android-web/dist/` (then copied into wrapper assets)
* native artifacts: APK/AAB produced by Gradle (and optionally copied into `release/`)

---

## 7. Static assets and bundling

BeeMage uses shared static inputs:

* **Pipeline examples**
  Source of truth: `assets/pipelines/**/*.json`
  Bundled into:

  * demo: `apps/demo/public/assets/pipelines/` → `apps/demo/dist/assets/pipelines/`
  * android-web: `apps/android-web/public/assets/pipelines/` → `apps/android-web/dist/assets/pipelines/`
  * GitHub Pages: published under `docs/assets/pipelines/` when you choose to publish them

* **OpenCV runtime (web demo only)**
  OpenCV is included only in the demo build path.
  It is copied into the demo `public/` directory and then emitted into `dist/` during Vite build.

---

## 8. Data flow

### Image to pipeline execution

1. Image loaded in Image tab
2. Selected as pipeline input
3. Pipeline executed step-by-step or end-to-end
4. Artifacts propagated through stages
5. Outputs displayed and made downloadable

### Builder to storage

1. Pipeline assembled in Builder
2. Type constraints enforced
3. Pipeline definition stored locally
4. Storage signals update dependent tabs

---

## 9. Logging model

BeeMage uses three independent channels:

* **Console trace** — ephemeral developer output
* **Debug trace** — persisted developer diagnostics
* **Action log** — user-visible history

These channels are intentionally separated.

---

## 10. Permissions (extension delivery)

Declared permissions:

* `storage`
* `sidePanel`

No additional permissions are required.

---

## 11. Summary

BeeMage is architected as:

* one shared application core
* multiple delivery hosts
* strict separation between logic and platform
* fully local execution
* explicit and inspectable processing

This structure allows BeeMage to evolve across platforms without rewriting the core.

---