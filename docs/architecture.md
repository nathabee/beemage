# Architecture

**BeeMage — Explore image processing through visual pipelines**
* **Document updated for version:** `0.1.10`

This document describes the **architecture of BeeMage**, its **shared core**, and its **delivery-specific runtimes**.

BeeMage is built around a single, delivery-agnostic application core that is executed in different browser environments.

---

## 1. Architectural overview

BeeMage consists of three layers:

1. **Application Core** (shared)
2. **Platform / Runtime Seams**
3. **Delivery Formats**

All image processing happens **locally in the browser**.
There is no backend and no remote processing.

---

## 2. Application core (shared)

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

## 3. High-level core architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         Application UI                          │
│               panel/panel.html + panel.ts                       │
│                                                               │
│  Tabs: Image | Pipeline | Builder | Colors | Settings | Logs   │
│                                                               │
│  - tab modules (tabs/*)                                        │
│  - in-memory artifacts and previews                            │
│  - user-triggered downloads                                   │
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
│  - opsDispatch (facade + core)                                  │
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

## 4. Core modules and responsibilities

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

---

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

---

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

---

### `src/shared/*` — shared services

* `shared/platform/storage.ts`
  Storage abstraction.

* `actionLog.ts`
  User-visible audit history.

* `debugTrace.ts`
  Developer diagnostics.

* `devConfigStore.ts`
  Development flags and limits.

---

## 5. Delivery format: Static Web application

The static web delivery runs BeeMage as a **browser application**.

### Runtime characteristics

* Standard web runtime
* OpenCV (WASM) execution enabled
* Static asset loading
* No browser-extension APIs

### Boot sequence

1. Load static HTML container
2. Inject `panel.html` and `panel.css`
3. Boot the shared panel entry (`panel.ts`)
4. Resolve assets via runtime abstraction

### Runtime substitution

During build, platform seams are swapped to web-compatible implementations:

* runtime
* storage
* engine adapter
* operation dispatch

This allows OpenCV-backed execution while keeping the core unchanged.

---

## 6. Delivery format: Chrome Extension

The Chrome Extension delivery runs BeeMage as a **Manifest V3 Side Panel**.

### Runtime characteristics

* Chrome extension APIs
* Native execution engine
* Extension storage
* Packaged asset resolution

### Entry points

* `manifest.json`
* `side_panel.default_path`: `panel/panel.html`

The Side Panel hosts the **same UI and application core** as the web version.

---

### Content script

A content script entry exists at `src/content.ts`.

In the current architecture:

* the UI and processing live entirely in the Side Panel
* the content script is minimal
* it may be removed if not required

---

## 7. Demo build architecture (static web)

The demo build uses the **same application core** and swaps runtime seams at build time.

### Seam swapping

During Vite build, module resolution redirects:

* platform runtime
* storage
* engine adapter
* operation dispatch

to demo-specific implementations.

### Static assets

Build-time plugins ensure required assets are available:

* OpenCV runtime (`opencv.js`, `opencv.wasm`)
* pipeline example JSON files

Assets are copied into static directories and served by the web runtime.

---

## 8. Data flow

### Image to pipeline execution

1. Image loaded in Image tab
2. Selected as pipeline input
3. Pipeline executed step-by-step or end-to-end
4. Artifacts propagated through stages
5. Outputs displayed and made downloadable

---

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
* multiple delivery runtimes
* strict separation between logic and platform
* fully local execution
* explicit and inspectable processing

This structure allows BeeMage to evolve across platforms without rewriting the core.

---
 