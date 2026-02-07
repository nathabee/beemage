 # <img src="./docs/icon.svg" alt="Icon" width="60" style="vertical-align:middle; margin-right:20px;"> BeeMage — Explore image processing through visual pipelines

**BeeMage is a client-side image-processing playground that lets you build and run visual pipelines directly in your browser.**


BeeMage runs **entirely client-side** and is available as:

* a **standalone web application**, and
* a **Chrome Extension (Manifest V3)**.

No uploads. No server processing.

---

## Try it now

You can use BeeMage immediately in your browser:

👉 **[Try the demo on github page](https://nathabee.github.io/beemage/demo/)**

The demo runs the same panel UI as the extension, without requiring any installation or browser permissions.

---


## What BeeMage does 

BeeMage focuses on a clear goal:

> Turning an image into clean intermediate representations (edges, masks, regions, SVG) — while **making each processing step visible and understandable**.


BeeMage is designed as a **hands-on image processing playground**.

With BeeMage, you can:

* Load an image directly in the browser
* Extract and repair contours step by step
* Observe intermediate representations (edges, masks, cleaned results)
* Adjust parameters and immediately see their effect
* Export the result as raster images or SVG paths
* Build and import custom image-processing pipelines (Builder tab)


The workflow is **manual, visual, and iterative by design**.
Pipelines can be predefined, imported, or extended step by step.

BeeMage deliberately avoids “one-click magic” in favor of **understanding how parameters influence results**.

---
## Native vs OpenCV: a comparative playground

BeeMage supports an engine strategy layer in the standalone web demo, allowing selected steps to run either as native TypeScript implementations or OpenCV (WASM) implementations.
At the moment, OpenCV is experimental and enabled for one step only: image.clean.removeSmallComponents.

### Native (self-implemented) pipeline (extension + web)

* Written in TypeScript
* Small, transparent, and easy to inspect
* Designed for learning, experimentation, and fine control
* Makes algorithmic choices explicit

### OpenCV (WebAssembly) pipeline (web demo only)

* OpenCV is loaded only in the demo build (no CDN), runs locally in the browser once enabled.
* OpenCV is not a full alternative pipeline yet; it’s a per-step implementation option.
* Current coverage: only image.clean.removeSmallComponents is implemented via OpenCV.

The goal is not benchmarking. The goal is comparison and understanding:

* How does the same operation behave in a native implementation vs OpenCV?
* Which parameters matter most?
* Where do results diverge?
* What trade-offs exist between simplicity, robustness, and complexity?

## Optional OpenCV support (web demo only)

OpenCV support is optional and currently available **only in the standalone web demo**.

The Chrome Extension (Manifest V3) does **not** include OpenCV at the moment because the OpenCV loading/build approach used in the demo is not compatible with **MV3 CSP requirements**.
For now, OpenCV remains demo-only and the extension always runs in **native mode**.

* BeeMage works fully without OpenCV
* When enabled in the demo, OpenCV:
  * is bundled locally with the demo (no CDN)
  * runs client-side via WebAssembly
  * increases bundle size and memory usage compared to native mode

Details on enabling and packaging OpenCV are documented in:

👉 `docs/installation.md`

---

## Typical use cases 

BeeMage is useful for:

* Exploring image extraction and cleanup techniques
* Learning classic image-processing concepts visually
* Comparing algorithmic approaches (native vs OpenCV)
* Preparing outlines for illustration or vector work
* Teaching or self-teaching image processing fundamentals
* Quick experiments without installing heavy desktop software

It is **not** intended to replace professional image editors or automated batch tools.

---

## Privacy

BeeMage is designed to be transparent and review-friendly.

* Runs entirely **locally in the browser**
* No analytics
* No advertising
* No tracking
* No uploads and no server-side image processing


Privacy policy: `docs/privacy.html`

---

## Documentation
 

All documentation is available on the project homepage and in the `docs/` folder:

👉 <a href="https://nathabee.github.io/beemage/index.html">
  <img src="./docs/visitgithubpage.svg" alt="Docs" width="300" style="vertical-align:middle;">
</a>

* Overview and presentation: `docs/presentation.md`
* Installation and deployment: `docs/installation.md`
* Versioning and development notes: `docs/version.md`

---

## Project status

BeeMage is in active development.

* Versioning status : `docs/version.md`

Feedback, testing, and issue reports are welcome.

---

## Links

* Homepage: [https://nathabee.github.io/beemage/](https://nathabee.github.io/beemage/)
* Live demo: [https://nathabee.github.io/beemage/demo/](https://nathabee.github.io/beemage/demo/)
* Issues & support: [https://github.com/nathabee/beemage/issues](https://github.com/nathabee/beemage/issues)

---

## License

MIT — see `LICENSE`

--- 