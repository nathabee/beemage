# Installation

This document explains how to install **BeeMage — Extract the main outline** locally for development.

## Requirements

- Google Chrome (or Chromium-based browser)
- Node.js
- Git

## Install dependencies

From the project root:

```bash
npm install
````

## Prepare OpenCV runtime (optional, required for Segmentation/OpenCV engine)

BeeMage can run without OpenCV, but the Segmentation tab can optionally use OpenCV (WASM) for comparison.

```bash
chmod +x assets/opencv/get-opencv.sh
./assets/opencv/get-opencv.sh
```

This copies `opencv.js` and `opencv.wasm` into `assets/opencv/` (these files are typically gitignored).

## Build the extension

```bash
npm run build
```

This generates the production-ready extension files in:

* `dist/`

## Load in Chrome (Developer Mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` directory

The extension will now be available locally.

## Notes

* This project is client-side only.
* No external services are required to run the extension.
* If the Segmentation/OpenCV probe shows a 404, re-run `./assets/opencv/get-opencv.sh` and rebuild.
