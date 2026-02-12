# Tester Guide

**BeeMage — Explore image processing through visual pipelines**  
* **Document updated for version:** `0.2.2`

This document explains how to test BeeMage across its supported delivery formats.

BeeMage is a single shared application core (`/src`) executed in different runtime hosts (`/apps/*`).
Each delivery format has its own platform characteristics and must be verified independently.

---

## 1. Testing goals

Testing focuses on:

- correctness of pipeline execution
- clarity of visual feedback
- predictable state transitions
- persistence behavior (per runtime)
- clean logging behavior (action log vs debug trace vs console trace)

---

## 2. Delivery formats

BeeMage is delivered through three formats:

1. **Web Demo** (Vite build published to GitHub Pages)
2. **Chrome Extension** (MV3 Side Panel)
3. **Android App** (WebView wrapper embedding the Android web bundle)

All three run the same panel UI and pipeline core.

---

## 3. Web Demo (apps/demo)

### 3.1 Runtime characteristics

- Runs as a standard website (no extension APIs)
- Uses seam swapping for platform modules (runtime/storage/engine)
- Can load OpenCV (WASM) for experimentation
- Uses static asset deployment (`docs/demo` for GitHub Pages)

OpenCV is **demo-only** and **optional** from a product perspective, but the demo build requires that
OpenCV assets are available either via committed `docs/assets/opencv/` or via `node_modules/@opencv.js/wasm`
(the demo build copies them into `apps/demo/public/` automatically).

### 3.2 Install + run (dev)

```bash
cd apps/demo
npm install
npm run dev -- --host
```

Open the printed URL in a browser.

### 3.3 Build + preview (production build)

```bash
cd apps/demo
npm run build
npm run preview -- --host
```

Build output:

```
apps/demo/dist/
```

### 3.4 OpenCV runtime refresh (only when updating OpenCV)

If you bump the OpenCV package version or want to refresh the committed runtime assets:

```bash
cd apps/demo
./scripts/get-opencv.sh
```

This updates:

* `docs/assets/opencv/` (GitHub Pages runtime)
* `apps/demo/public/assets/opencv/` (served by Vite)

### 3.5 What to verify (web demo)

* App boots and renders consistently
* Tabs render correctly:

  * Image
  * Pipeline
  * Builder
  * Colors
  * Settings
  * Logs
* Pipeline execution works end-to-end
* Intermediate artifacts display correctly (image/mask/svg)
* OpenCV-backed operations (if enabled) work and fall back safely when disabled
* Downloads (PNG/SVG) work in the browser
* No unexpected errors in console

---

## 4. Chrome Extension (apps/extension)

### 4.1 Runtime characteristics

* Runs as a Chrome Side Panel (MV3)
* Uses Chrome extension platform APIs where appropriate
* Uses native (TypeScript) execution engine
* OpenCV is intentionally disabled in the extension runtime

### 4.2 Build + load unpacked (developer mode)

```bash
cd apps/extension
npm install
npm run build
```

Then:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select:

```
apps/extension/dist/
```

(the folder that directly contains `manifest.json`)

### 4.3 Iteration workflow

```text
edit code
↓
cd apps/extension && npm run build
↓
chrome://extensions → Reload
↓
open BeeMage side panel
```

### 4.4 Test the release ZIP

```bash
./apps/extension/scripts/build-zip.sh
```

Output:

```
release/beemage-<version>.zip
```

Test procedure:

1. Unzip into a folder
2. `chrome://extensions` → Developer mode
3. Load unpacked → select the folder containing `manifest.json`

### 4.5 What to verify (extension)

* Side panel opens reliably
* All tabs render correctly
* Pipelines execute correctly
* Storage persists across reloads/restarts (extension storage)
* Logs behave correctly:

  * user-visible actions go to action log
  * developer debugging goes to debug trace
  * console trace is dev-only
* No runtime errors

---

## 5. Android App (apps/android-web + apps/android-native)

Android is two layers:

* **Android web bundle:** `apps/android-web` (Vite build)
* **Android wrapper:** `apps/android-native` (Gradle / Android Studio project)

### 5.1 Build the Android web bundle and sync into wrapper assets

```bash
./apps/android-web/scripts/build-android-web.sh
```

This produces a web build and copies it into:

```
apps/android-native/app/src/main/assets/
```

### 5.2 Build Android APK/AAB from CLI

Preferred (consistent with CI/F-Droid/Play):

```bash
./apps/android-native/scripts/build-android-native.sh all release
```

Typical development loop:

```bash
./apps/android-native/scripts/build-android-native.sh apk debug
```

### 5.3 What to verify (Android)

* App installs and launches cleanly
* WebView loads assets via `WebViewAssetLoader` (no file:// hacks)
* No cleartext networking opt-in (HTTPS-only posture)
* Pipeline execution works (native JS engine)
* Local persistence works (WebView localStorage behavior)
* No policy-dangerous logs in production builds
* Minimal permissions (usually INTERNET only)

---

## 6. Platform coverage

At minimum, test one config per group:

* Windows + Chrome
* macOS + Chrome
* Linux + Chrome
* Android device (physical) + at least one recent WebView version

Focus on:

* layout / sizing / DPI
* download/export behavior (web + extension)
* persistence across restarts (extension + Android)
* stability under repeated runs

---
