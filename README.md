# BeeContour — Extract the main outline

**BeeContour extracts clean contour outlines from images directly in your browser.**
It works best with **high-contrast subjects** such as winter trees, drawings, silhouettes, or scanned artwork.

BeeContour is a **Chrome Extension built on Manifest V3**.
All processing happens **locally** in the browser.

---

## What this extension does

BeeContour solves a simple, focused problem:

> Turning an image into a clean outline that can be reused, refined, or colored — without uploading it anywhere.

With BeeContour, users can:

* Load an image directly in the extension panel
* Extract the main contour outline using adjustable edge detection
* Preview the result immediately
* Download the outline as a PNG
* Optionally color regions inside closed contours using an interactive workflow

The extension is designed for **manual, visual workflows**, not automated batch processing.

---

## Typical use cases

BeeContour is useful for:

* Preparing outlines for illustration or graphic design
* Extracting tree branches, silhouettes, or line art
* Creating coloring bases from photos or scans
* Educational or exploratory image processing
* Quick experiments without installing heavy software

It is **not** intended to replace full image editing tools.

---

## Privacy

BeeContour is designed to be transparent and review-friendly.

* Runs entirely **locally in the browser**
* No analytics
* No advertising
* No tracking
* No network requests for image processing

Privacy policy: `docs/privacy.html`

---

## Installation (developer mode)

Until published on the Chrome Web Store, BeeContour can be installed manually:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the folder containing `manifest.json`

---

## Build

To build the extension locally:

```bash
npm install
npm run build
./scripts/build-zip.sh
```

This produces a packaged extension ready for testing or submission.

---

## Demo (standalone)

The `demo/` folder contains a standalone version of the panel UI.

* Runs in a normal browser tab
* Uses mock runtime and storage
* Does not require Chrome extension APIs
* Suitable for GitHub Pages demos

```bash
cd demo
npm install
npm run build
npm run preview -- --host
```

---

## Project status

BeeContour is in an **early development phase**.

* Core contour extraction is functional
* Interactive region coloring is implemented
* Architecture is stable but still evolving

Feedback and testing are welcome.

---

## Links

* Homepage: [https://nathabee.github.io/beecontour/](https://nathabee.github.io/beecontour/)
* Support / Issues: [https://github.com/nathabee/beecontour/issues](https://github.com/nathabee/beecontour/issues)

---

## License

MIT — see `LICENSE`

--- 