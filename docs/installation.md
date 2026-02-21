# Installation

This document explains how to install **BeeMage — Explore image processing through visual pipelines** locally for development.

* **Document updated for version:** `0.2.2`

---

## Requirements

- Git
- Node.js (LTS recommended)
- npm
- Google Chrome (or Chromium-based browser)
- Java (JDK 17 recommended) — required for Android native builds

---

## Repository layout (quick orientation)

- Shared core: `src/`
- Web demo host: `apps/demo/`
- Chrome extension host: `apps/extension/`
- Android web bundle host: `apps/android-web/`
- Android native wrapper: `apps/android-native/`

---

## 1) Chrome Extension (apps/extension)

### Install dependencies

```bash
cd apps/extension
npm install
```

### Build the extension

```bash
npm run build
```

Build output:

* `apps/extension/dist/`

### Load in Chrome (Developer Mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select: `apps/extension/dist/` (the folder that directly contains `manifest.json`)

---

## 2) Web Demo (apps/demo)

The demo runs the real shared panel UI in a normal website runtime using seam swapping.

### Install dependencies

```bash
cd apps/demo
npm install
```

### Prepare OpenCV runtime (optional, demo-only)

OpenCV is **demo-only** and used for experimentation/comparison.

```bash
./scripts/get-opencv.sh
```

What the script does (exact):

* copies `opencv.js` and `opencv.wasm` from:

  * `apps/demo/node_modules/@opencv.js/wasm/`
* into:

  1. `assets/opencv/` (canonical runtime for publishing; typically committed/published)
  2. `apps/demo/public/assets/opencv/` (served by Vite; generated)

### Run dev server (hot reload)

```bash
npm run dev -- --host
```

### Build the demo

```bash
npm run build
```

Build output:

* `apps/demo/dist/`

### Test the built demo locally

```bash
npx serve dist
```

If OpenCV assets 404 in the demo runtime, rerun:

```bash
./scripts/get-opencv.sh
npm run build
```

---

## 3) Android Web Bundle (apps/android-web)

This produces the static WebView-compatible bundle that the native wrapper embeds.

### Install dependencies

```bash
cd apps/android-web
npm install
```

### Build

```bash
npm run build
```

Build output:

* `apps/android-web/dist/`

### Build + copy into the native wrapper (recommended path)

From repo root:

```bash
./apps/android-web/scripts/build-android-web.sh
```

This builds `apps/android-web/dist/` and copies it into:

* `apps/android-native/app/src/main/assets/`

Nothing under `apps/android-native/app/src/main/assets/` should be committed (except `.gitkeep`).

---

## 4) Android Native Wrapper (apps/android-native)

This is the Android Studio / Gradle project that embeds the web bundle via WebView.

### Open in Android Studio (manual workflow)

1. Ensure assets are present (run the Android web bundle script above).
2. Open Android Studio.
3. Open the folder: `apps/android-native/`
4. Build / Run.

### Command-line build (recommended for reproducible releases)

From repo root:

```bash 
./apps/android-native/scripts/build-android-native.sh apk debug

```

For release artifacts (signing required):

```bash
./apps/android-native/scripts/build-android-native.sh all release
```

 `build-android-native.sh` call the Gradle tasks above and place outputs into `release/`.

---

## Notes

* BeeMage runs fully client-side. No external services are required.
* OpenCV is demo-only (web runtime). Extension and Android are native TypeScript engine only (unless explicitly enabled later).
* The single source of truth for app logic remains `src/`. `/apps/*` are delivery hosts.

 