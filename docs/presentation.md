# BeeMage — Presentation

**— Explore image processing through visual pipelines —**

**BeeMage is a visual image-processing tool that lets you build, run, and inspect processing pipelines directly in your browser.**
It is designed for **exploration, understanding, and manual refinement**, not black-box automation.

BeeMage runs entirely **locally in the browser**.
No backend. No uploads. No tracking.

---

## Project info

* **Project code:** `beemage`
* **Document updated for version:** `0.1.10`
* **Homepage:** [https://nathabee.github.io/beemage/](https://nathabee.github.io/beemage/)
* **Issues / support:** [https://github.com/nathabee/beemage/issues](https://github.com/nathabee/beemage/issues)

---

## What BeeMage is

BeeMage is a **pipeline-based image processing environment**.

It lets you:

1. Load an image
2. Select or build a processing pipeline
3. Run it step-by-step or end-to-end
4. Inspect intermediate results
5. Optionally apply region-based coloring
6. Download the final output (PNG or SVG)

All processing is **explicit, visible, and interactive**.

---

## Core concepts

### Visual pipelines

BeeMage is built around a **universal pipeline runner**.

A pipeline is a sequence of typed operations, for example:

```
image → edge detection → threshold → morphology → svg
```

Each pipeline is composed of:

* **stages** (logical steps)
* **operations** (small, well-defined processes)
* **artifacts** (`image`, `mask`, `svg`) flowing between them

You can:

* run a pipeline in one click
* execute it step-by-step
* inspect every intermediate output

---

### Builder — create and manage pipelines

The **Builder** lets you:

* browse all available operations
* assemble pipelines via drag & drop
* enforce type compatibility automatically
* save pipelines locally
* define and manage **recipes** (parameter presets)
* load example pipelines from JSON

Pipelines can be created and modified **without code changes**.

---

### Region-based coloring

On compatible outputs, BeeMage provides **interactive region coloring**:

* click inside a closed region to preview detection
* adjust edge, noise, and gap parameters
* explicitly apply or cancel fills
* work with a predefined color palette

Coloring is an optional step layered on top of pipeline output.

---

## Key features

### Image input

* Drag & drop or file picker
* Local preview
* No upload, no persistence unless you download

### Pipeline execution

* Select pipeline and recipe
* **Run all** or **Next step**
* Reset execution state explicitly
* Per-stage and per-operation previews
* Download output as PNG or SVG

### Pipeline builder

* Operation library with IO typing
* Drag-and-drop pipeline playground
* User pipelines stored locally
* JSON import/export
* Example pipeline loader

### Tuning & engines

* Central parameter registry
* Presets and persisted overrides
* Engine policy handling
* Deterministic execution paths

### Logs & transparency

* User-visible action log
* Developer debug trace
* Exportable logs
* No hidden behavior

---

## Typical use cases

BeeMage is well suited for:

* Extracting outlines and silhouettes
* Exploring image processing workflows
* Teaching or learning image processing concepts
* Prototyping pipelines visually
* Preparing base assets for illustration or coloring
* Debugging and understanding processing steps

It is **not** intended to replace full-scale image editors or batch automation tools.

---

## Project philosophy

BeeMage follows a few strict principles:

* **Explicit over implicit**
  No automatic processing. No hidden state.

* **Visual first**
  Every step produces inspectable output.

* **Composable, not monolithic**
  Small operations with clear contracts.

* **Local and inspectable**
  Everything runs in the browser and can be inspected with DevTools.

* **Minimal dependencies**
  No frameworks, no backend, no analytics.

---

## Technical overview (high level)

* Browser-based execution

* Canvas-based image processing

* Modular tab architecture:

  * Image
  * Pipeline
  * Builder
  * Colors
  * Settings
  * Logs

* Universal pipeline runner

* Multiple delivery formats sharing the same core

See **Architecture** and **User Manual** for details.

---

## Project status

BeeMage is in **active development**.

* Core pipeline system is stable
* Builder and recipes are functional
* UI and APIs are evolving
* Feedback and testing are welcome

---

## License

See the `LICENSE` file at the repository root.

---
 