# Version History — BeeMage — Extract the main outline

This document tracks functional and architectural changes of  
**BeeMage — Extract the main outline**.

Conventions:

- Versions are listed with the **newest at the top**
- Use:
  - `##` for **major** versions
  - `###` for **minor** versions
  - `####` for **patch** versions
- Keep entries concise and factual
 

---

## **MAJOR v0**

### **v0.x — Focus: Development and stabilization**

* Iterative development phase
* Architecture exploration and refinement
* Internal testing and demos

--- 

#### v0.1.6 — Epic: User pipeline recipes (JSON import/export)

* Add **v2 import/export format** bundling user pipelines **and recipes**
* Extend **recipeStore** to persist, load, and select recipes per pipeline
* Builder tab: **import/export v2**, pipeline CRUD, recipe CRUD
* Builder UI: **pipeline search filter** and **operation IO filters**
* Ensure recipe arrays are always present (optional but array-only)
* Pipeline tab loads recipes from store
* Recipe selector shows **user recipes + Default**
* Selected recipe builds the effective pipeline
* Safe fallback to **Default** when recipe is missing

---

#### v0.1.5 — Epic: User Pipelines in Builder, PipelineCard, and OperationCard

* Add shared UI components: **OperationCard** (for operations) and **PipelineCard** (pipeline preview built from OperationCards), reusable across Builder + Pipeline tabs
* Builder tab: list **all operations** from the global catalogue and add **filtering by input/output type** (defaults to “All”; combined when both are set)
* Builder tab: enable **selecting a stored user pipeline** and render it via **PipelineCard** (optional connector lines between steps if present)
* Update `docs/assets/pipelines/beemage-pipelines.json` to include **two user pipeline examples** (single-op + multi-op) for testing import + UI
* Update README to mention the **Pipeline tab** (universal runner) and **Builder tab** (import/export user pipelines + future visual pipeline construction) while keeping existing links unchanged
* Small UI/CSS updates to support the new cards (layout, IO badges/colors, compact pipeline display)

---

#### v0.1.4 — Epic: User Pipelines in Builder

* Add new **Builder** tab to manage user-defined pipelines
* Implement Builder MVP: **import/export** pipeline JSON via UI (`builderImportFile`, `btnBuilderExport`)
* Split storage into `userPipelineStore.ts` (load/save/upsert/delete user pipelines)
* Extend pipeline catalogue to **merge built-ins + user pipelines** (`listPipelines()`, `getPipeline()`, user overrides win on ID collision)
* Update Pipeline model to **reload catalogue from storage** (`reloadCatalogue()`), so imported pipelines can appear in Pipeline tab
* Fix Pipeline “Next step” regression caused by placeholder `runNext()`; restore full step-mode execution
* Add JSON example pipeline file: `/docs/assets/pipelines/beemage-pipelines.json` (“iconize” resize pipeline)

---

#### v0.1.3 — Epic: Rename project from BeeContour to BeeMage

* Rename project across codebase: identifiers, paths, UI strings, and artifacts
* Rebuild icons/assets and ensure packaging still compiles
* Rename GitHub repository and align docs/release references accordingly


### v0.1.2 — Epic: Remove non-universal UI

* Remove Segmentation tab (all segmentation workflows run via Pipeline tab)
* Remove image-tab “clean / vectorize / svg / download” workflows (run via Pipeline tab)
* Reduce image tab to **Input only**: load image into `#srcCanvas` (drag-drop + file picker)
* Remove legacy DOM + TS wiring for removed controls, keep tabs: image, Pipeline, Colors, Settings, Logs
* Ensure **all runtime errors** are surfaced to `actionLog` + `debugTrace` (no silent failures)

---


 #### v0.1.1 — Epic: Add EDGE + SVG pipelines

* Introduce new artifact type: `svg` (pipeline IO + VM + preview/download support)
* Add dispatch ops: `edge.*` (image → mask/image) and `svg.create` (mask/image → svg)
* Define new pipeline **EDGE** (stages: resize → threshold → morphology → extract)
* Define new pipeline **SVG** (stages: edge pipeline → svg.create; optional style params)
* Add recipes/presets: `edge.fast/strong`, `svg.default` (incl. stroke/fill/color/scale defaults)
* Ensure runner supports `image|mask → svg` in **Run all** path (final output must be `result.output`)
* Pipeline tab: “Download” button exports final artifact (SVG or PNG) with stable filename
* Error surfacing: stage/op failures shown in UI + actionLog + debugTrace, never silent

 
#### v0.1.0 — Epic: Universal pipeline runner foundation

* Introduce the universal pipeline runner (`panel/app/pipeline`) with catalogue-driven stages/ops and IO validation
* Add the new Pipeline tab (`panel/tabs/pipeline`) with pipeline + recipe selectors and per-stage previews
* Wire runner ops through `opsDispatch` so pipeline execution uses the same dispatch seam as existing tabs
* Extend tuning to support universal pipeline workflows (pipeline selection persisted via `pipeline.mode` and scoped tuning mounts)
* Align pipeline runner param resolution with registry-based defaults + overrides (`getEffectiveParams`)
* Keep Segmentation tab functional while duplicating its execution path through the universal runner for parity testing
* Add action/debug traces for pipeline validation failures and op execution failures (pipelineId/stageId/opId + dims)
* Demo/extension seam preserved: demo uses mock impls, extension build remains native-only (no OpenCV injection)

 ---

#### v0.0.10 — Epic: Segmentation issues and native code

* Ensure tracing is mounted at boot (panel.ts) so logs work before visiting Settings
* Segmentation pipeline now seeds from the original source canvas (not from processed/edge output)
* Implement native demo ops for segmentation steps: resize, denoise, color, morphology (no OpenCV in native)
* Wire demo seam swap so demo uses `/demo/src` opsDispatchImpl while extension stays on `/src`
* Add richer per-op trace output (impl source + params) to verify correct dispatcher path
* Fix segmentation reset: clear session + restore preview from source (no “blank image” state)
* Keep tuning nodes collapsed by default in all scopes (expand only when needed)
* Docs: add “Open demo in new window” link/button in `docs/index.html`

---

#### v0.0.9 — Epic: Segmentation step runner (interactive execution + live preview)

* Add **step-by-step execution controls** to the Segmentation tab:

  * `Next step` advances the pipeline by exactly one subprocess
  * `Run all` executes the full pipeline sequentially
  * `Reset` clears the session and preview
* Introduce a **segmentation session state** in the tab to avoid recomputation:

  * persists intermediate artifacts between clicks (image for steps 1–3, mask for steps 4–5)
  * tracks current step index and pipeline progress
* Enhance pipeline UX with **visual step state**:

  * highlight the active step while waiting for user action
  * mark completed steps as done
  * keep fixed pipeline order; presets still configure each subprocess via tuning
* Upgrade preview behavior:

  * single preview canvas displays intermediate **image outputs** (steps 1–3)
  * switches to **mask preview** for threshold/morphology outputs (steps 4–5)
* Add lightweight status reporting during execution:

  * current step name + completion status
  * error handling path surfaces failures without breaking the tab state

---

#### v0.0.8 — Epic: Segmentation pipeline with drag-and-drop presets per subprocess

* Add a dedicated **Segmentation tab** with a fixed 5-step pipeline:

  * `segmentation.resize` → `segmentation.denoise` → `segmentation.color` → `segmentation.threshold` → `segmentation.morphology`
* Implement a **preset library** for segmentation:

  * draggable preset cards
  * per-target filtering via `preset.target` (recipe vs per-step)
* Add **drag-and-drop drop zones**:

  * pipeline header drop zone for full “recipe” presets (`target: "segmentation"`)
  * per-step drop zones for step-specific presets (e.g. `target: "segmentation.threshold"`)
* Wire presets into the existing **tuning system**:

  * dropping a preset calls `tuningController.applyPreset(...)`
  * preset values are persisted via the tuning store and immediately reflected by the tuning UI
* Extend the **tuning registry** to include segmentation components so resolution works uniformly:

  * register `segmentation` and the 5 step nodes with parameter schemas + defaults
  * enables consistent `resolveComponent(...)` behavior for segmentation ops
* Keep OpenCV constraints intact:

  * extension build remains native-only (OpenCV paths stubbed/fallback as needed)
  * demo build can provide OpenCV implementations via the demo dispatcher wiring

 

---

#### v0.0.7 — Epic  : Engine strategy + per-step pipeline control (demo-only OpenCV)

* Introduce a **segmentation pipeline definition** with multiple steps (Process 1…10) and a stable step API.
* Add **engine strategy model**:

  * global default: `native | auto | opencv`
  * per-step overrides: `inherit | native | auto | opencv`
* Persist engine strategy in storage (demo + extension; OpenCV mode forced-off in extension).
* Implement a **step dispatcher**:

  * resolve effective engine per step (override → default → availability)
  * explicit failure path when `opencv` is forced but unavailable (no silent fallback)
* Add Settings UI for strategy:

  * show **OpenCV availability** (runtime)
  * show **OpenCV mode preference** (demo-only)
  * show global + per-step controls (can start minimal)
* Add Logs/debug trace messages for:

  * engine resolution decisions
  * step timings and failures
* Keep OpenCV loading strictly **demo-only** (CSP: not supported in extension).
* in this version the opencv is just possible for the image.clean.removeSmallComponents

---

#### v0.0.6 — Demo-only OpenCV toggle + segmentation placeholder + cleanup
 

* **Engine moved out of Segmentation**:

  * Segmentation tab is now a placeholder (no injection/probe logic there).
  * Engine/OpenCV controls live in **Settings**.
* **Demo-only OpenCV support (CSP-safe)**

  * OpenCV loading is possible only in the **demo build** via the demo seam (`engineAdapter` mock/loader).
  * Extension build does **not** allow injection/loading (CSP concern).
* **OpenCV runtime state plumbing**

  * Introduced a shared `isOpenCvInjected()` availability check used by Settings.
  * UI can show “Native mode / OpenCV mode enabled / OpenCV loaded”.
* **Settings engine UI behavior**

  * Engine section can be hidden when OpenCV loading is not supported (extension build).
  * OpenCV “mode” is persisted in storage (demo), and enabling it triggers a one-time load.
* **Removed old probe button path**

  * Deprecated `btnCfgProbeOpenCv` in favor of the OpenCV mode toggle (and removed DOM references accordingly).
* **Global error hook cleanup**

  * Global error hooks should not live in `tabs.ts`. Move them to panel boot (or a dedicated `app/errors.ts`) so this is not “demo-related” and not tied to OpenCV.
 

* OpenCV will **not** be supported in the extension build due to CSP/packaging constraints; injection stays demo-only.

---

 
---

#### **v0.0.5 — OpenCV bootstrap**

* Added **OpenCV (WASM + JS)** to `assets/opencv`
* Introduced **Segmentation** tab for OpenCV integration experiments
* Implemented **safe dynamic loading** of OpenCV with runtime readiness checks
* Validated OpenCV availability via probe (cv, Mat, build info)
* Established working pattern:

  * global `Module.locateFile`
  * single script injection
  * readiness polling
  * avoid returning `cv` through async promise resolution

---

#### **v0.0.4 — Epic: Full image pipeline (clean → vectorize) + diagnostics**

* Expanded **Mage workflow** into a multi-stage pipeline:

  * edge detection
  * morphological cleaning (radius, min area, threshold)
  * quality metrics (components, junctions, thickness)
* Added **interactive cleaning controls** with repeatable passes
* Introduced **vectorization to SVG**:

  * boundary tracing
  * simplification (RDP)
  * optional smoothing
  * SVG preview and download
* Added **complexity guards** to prevent memory and performance failures
* Introduced a **structured logging system**:

  * console diagnostics
  * scoped debug traces
  * consistent logging across panel and background
* Fixed **Settings tab lifecycle** (mounting, refresh, version display)
* Improved demo ↔ extension parity and robustness

---

#### **v0.0.3 — Epic: Colors workflow + documentation**

* Added **Colors** tab with region-based fill workflow
* Implemented palette selection, preview, apply/reset
* Added edge/noise controls for region detection
* Updated documentation to reflect **Mage → Colors** workflow

---

#### **v0.0.2 — Epic: image extraction prototype**

* Added **Mage** tab with drag & drop / file input
* Implemented preview + processing pipeline
* Added output controls (process, PNG download)
* Introduced basic processing parameters

---

#### **v0.0.1 — Epic: Project bootstrap**

* Initialized BeeMage from extension-generic template
* Established panel scaffold (tabs, views, DOM binding)
* Set up build, demo, and documentation structure

---