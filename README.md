# <img src="./docs/icon.svg" alt="Icon" width="60" style="vertical-align:middle; margin-right:20px;"> BeeMage — Explore image processing through visual pipelines

**BeeMage is a client-side image-processing playground that lets you build, run, and inspect visual pipelines directly in your browser.**

BeeMage is designed for **exploration, understanding, and manual refinement** of image-processing workflows — not black-box automation.

All processing happens **locally in the browser**.

---

## Availability and delivery formats

BeeMage is available in multiple delivery formats:

* **Static web application** (standalone, browser-based)
* **Chrome Extension** (Manifest V3, Side Panel)

Each delivery runs the **same application core**, adapted to its runtime environment.

No uploads.
No server-side processing.

---

## Try it now

You can try BeeMage immediately in your browser:

👉 **[Live web demo](https://nathabee.github.io/beemage/demo/)**

The demo runs the same panel UI as the extension and requires no installation.

---

## What BeeMage does

BeeMage focuses on one principle:

> Making image-processing steps **visible, inspectable, and understandable**.

With BeeMage, you can:

* Load an image directly in the browser
* Run explicit image-processing pipelines
* Observe intermediate representations (edges, masks, cleaned regions, SVG)
* Adjust parameters and see results immediately
* Execute pipelines step by step or end to end
* Export results as PNG or SVG
* Create, import, and manage custom pipelines visually (Builder tab)

The workflow is **manual, visual, and iterative by design**.

BeeMage deliberately avoids one-click automation in favor of **understanding how processing decisions affect results**.

---

## Visual pipelines

BeeMage is built around a **pipeline-based execution model**.

A pipeline is a sequence of typed operations, for example:

```
image → edge detection → threshold → morphology → svg
```

Each step produces an explicit artifact (`image`, `mask`, or `svg`) that can be previewed and inspected.

Pipelines can be:

* selected from predefined examples
* built visually via drag & drop
* imported or exported as JSON
* extended with parameter presets (“recipes”)

---

## Native and OpenCV execution (web demo)

The standalone web version includes an **engine strategy layer** that allows selected operations to run using different implementations.

### Native execution

* Written in TypeScript
* Small, transparent, and inspectable
* Used in all delivery formats
* Emphasizes clarity and learning

### OpenCV (WebAssembly) execution

* Available in the **web demo**
* Loaded locally (no CDN)
* Used selectively for comparison and experimentation

OpenCV support is currently **partial and experimental** and exists to explore:

* algorithmic differences
* parameter sensitivity
* trade-offs between simplicity and robustness

The Chrome Extension always runs using the native engine.

---

## Typical use cases

BeeMage is well suited for:

* Exploring image-processing concepts visually
* Learning and teaching classic image-processing techniques
* Extracting and refining outlines or silhouettes
* Comparing different processing strategies
* Prototyping pipelines without desktop software
* Preparing base assets for illustration or vector work

It is not intended to replace full-scale image editors or batch automation tools.

---

## Privacy

BeeMage is designed to be transparent and review-friendly.

* Runs entirely **locally**
* No analytics
* No tracking
* No advertising
* No uploads

Privacy policy: `docs/privacy.html`

---

## Documentation

Detailed documentation is available in the `docs/` directory and on the project site:

👉 [https://nathabee.github.io/beemage/](https://nathabee.github.io/beemage/)

Key documents:

* Presentation and concepts: `docs/presentation.md`
* Architecture overview: `docs/architecture.md`
* Installation and deployment: `docs/installation.md`
* Versioning and development notes: `docs/version.md`

---

## Project status

BeeMage is in active development.

The core pipeline system is stable, while features and UI continue to evolve.

Feedback, testing, and issue reports are welcome.

This document was updated :
**Current version:** v0.1.10

---

## Links

* Homepage: [https://nathabee.github.io/beemage/](https://nathabee.github.io/beemage/)
* Live demo: [https://nathabee.github.io/beemage/demo/](https://nathabee.github.io/beemage/demo/)
* Issues and support: [https://github.com/nathabee/beemage/issues](https://github.com/nathabee/beemage/issues)

---

## License

MIT — see `LICENSE`

---
 