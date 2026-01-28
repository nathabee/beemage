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


#### **v0.0.6 — Epic (planned): OpenCV engine integration & per-step pipeline control**

* Introduce **OpenCV as an optional processing engine**, loaded on demand
* Separate **engine availability** (runtime) from **engine selection** (user preference)
* Define pipeline steps with **dual implementations** where applicable:

  * native JS implementation
  * OpenCV implementation (optional per step)
* Support **per-step engine selection**:

  * `native`
  * `opencv`
  * `auto` (prefer OpenCV when available, otherwise native)
* Add **global default engine strategy** with optional per-step overrides
* Enable **incremental migration** of pipeline steps to OpenCV without rewriting the full pipeline
* Centralize OpenCV loading and readiness checks (single shared loader)
* Explicit failure behavior when OpenCV is selected but not available (no silent fallback)

> Goal: selective acceleration and gradual OpenCV adoption while preserving correctness and debuggability.

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