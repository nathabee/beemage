# Version History — BeeContour — Extract the main outline

This document tracks functional and architectural changes of  
**BeeContour — Extract the main outline**.

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
* in this version the opencv is just possible for the contour.clean.removeSmallComponents

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

#### **v0.0.4 — Epic: Full contour pipeline (clean → vectorize) + diagnostics**

* Expanded **Contour workflow** into a multi-stage pipeline:

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
* Updated documentation to reflect **Contour → Colors** workflow

---

#### **v0.0.2 — Epic: Contour extraction prototype**

* Added **Contour** tab with drag & drop / file input
* Implemented preview + processing pipeline
* Added output controls (process, PNG download)
* Introduced basic processing parameters

---

#### **v0.0.1 — Epic: Project bootstrap**

* Initialized BeeContour from extension-generic template
* Established panel scaffold (tabs, views, DOM binding)
* Set up build, demo, and documentation structure

---