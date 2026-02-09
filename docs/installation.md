# Installation

This document explains how to install **BeeMage — Explore image processing through visual pipelines** locally for development.

* **Document updated for version:** `0.1.10`


## Requirements

- Google Chrome (or Chromium-based browser)
- Node.js
- Git


## Chrome extension

### Install dependencies

From the project root:

```bash
npm install
```

### Build the extension

```bash
npm run build
```

This generates the production-ready extension files in:

* `dist/`

### Load in Chrome (Developer Mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` directory

The extension will now be available locally.

## Demo (static web)

### Install dependencies

From the project root:

```bash
cd demo
npm install
```

### Prepare OpenCV runtime (optional, demo-only)

OpenCV is **demo-only**. You only need this step if you want to enable **OpenCV mode** in the demo.

```bash
chmod +x demo/scripts/get-opencv.sh
./demo/scripts/get-opencv.sh
```

What the script does (exact):

* copies `opencv.js` and `opencv.wasm` from:

  * `demo/node_modules/@opencv.js/wasm/`
* into these two locations:

  1. `docs/assets/opencv/` (canonical runtime for GitHub Pages; committed)
  2. `demo/public/assets/opencv/` (demo runtime served by Vite; generated)

### Build the demo
 

```bash
cd demo
npm run build
```

This generates the static demo output in:

* `demo/dist/`

### Test the built demo locally

```bash
cd demo
npx serve dist
```

## Notes

* This project is client-side only.
* No external services are required to run the extension.
* If the demo OpenCV probe shows a 404, re-run:

```bash
./demo/scripts/get-opencv.sh
```

then rebuild the demo.

```

---
 