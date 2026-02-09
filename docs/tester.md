Perfect, this is now very close.
Below is a **cleaned, final replacement** that does exactly what you asked:

* **only sections 1 / 2 / 3**
* no A/B/C, no sub-classification thinking
* no “what we don’t do / what we don’t want”
* **OpenCV mandatory in web**, via `node_modules`
* extension and web **fully separated**
* wording is factual, positive, and implementation-accurate
* numbering is consistent (no 3.6 / 3.7 drift)

You can paste this **as-is**.

---

# Tester Guide

**BeeMage — Explore image processing through visual pipelines**
**Version:** v0.1.10

This document explains how to test **BeeMage** across its supported delivery formats.

Each delivery format has its own runtime and platform characteristics and is tested independently.

---

## 1. Presentation

BeeMage is a visual image-processing tool built around **explicit pipelines** and **interactive exploration**.

Testing focuses on:

* correctness of pipeline execution
* clarity of visual feedback
* predictability of state and actions
* consistency of behavior within each delivery format

BeeMage is delivered through two formats:

1. **Static Web application**
2. **Chrome Extension**

The core UI and pipeline logic are shared.
Runtime and platform specifics are tested per format.

---

## 2. Static Web version (Browser application)

This section applies when BeeMage is run as a **static web application**
(GitHub Pages, local static hosting, iframe embedding, etc.).

---

### 2.1 Runtime and platform

* Runs as a **standard website**
* Same UI and pipeline logic as other deliveries
* Web runtime with **OpenCV (WASM) support**
* Static asset–based deployment

OpenCV is a **required runtime dependency** for the static web version.

---

### 2.2 Install dependencies and prepare OpenCV runtime

The static web version requires `node_modules` in order to install the OpenCV runtime.

From the project root:

```bash
cd demo
npm install
./scripts/get-opencv.sh
```

This copies OpenCV runtime files from `node_modules` into:

* `docs/assets/opencv/` (GitHub Pages runtime)
* `demo/public/assets/opencv/` (served by Vite)

---

### 2.3 Build and run

From the `demo/` directory:

```bash
npm run build
```

Build output:

```
demo/dist/
```

Serve locally:

```bash
npx serve dist
```

Open the served URL in a browser.

---

### 2.4 What to verify (static web)

* Application loads correctly in a browser

* All tabs render:

  * Image
  * Pipeline
  * Builder
  * Colors
  * Settings
  * Logs

* Pipelines execute correctly

* OpenCV-backed operations execute correctly

* Outputs can be downloaded

* Visual feedback matches pipeline state

---

## 3. Chrome Extension version

This section applies when BeeMage is run as a **Chrome Extension**
(Manifest V3, Side Panel UI).

---

### 3.1 Runtime and platform

* Runs as a **Chrome Side Panel**
* Uses Chrome extension platform APIs
* Native execution engine
* Packaged as a production extension build

---

### 3.2 Build and load (developer mode)

From the project root:

```bash
npm install
npm run build
```

Then:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` directory
   (the folder that directly contains `manifest.json`)

---

### 3.3 Iteration workflow

```text
edit code
↓
npm run build
↓
chrome://extensions → Reload
↓
open BeeMage side panel
```

Use this workflow for development and verification.

---

### 3.4 Test the release ZIP

This verifies the packaged extension artifact.

```bash
./scripts/build-zip.sh
```

Output:

```
release/beemage-<version>.zip
```

Test procedure:

1. Unzip the ZIP into a folder
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the folder that directly contains `manifest.json`

---

### 3.5 What to verify (extension)

* Side panel opens reliably
* All tabs render correctly
* Pipelines execute correctly
* Storage persists across reloads
* Logs behave as expected
* No runtime errors appear

---

### 3.6 Platform coverage

Testing should include at least one configuration from each group:

* Windows 11 + Chrome
* Windows 11 + Edge
* macOS + Chrome
* Linux (Ubuntu) + Chrome

Focus on:

* layout and sizing
* DPI scaling
* download behavior
* storage persistence after restart

---

### 3.7 Testing principle

BeeMage is designed around:

* explicit user actions
* visual feedback at every step
* predictable state transitions

Testing should always verify that:

* every operation is intentional
* each action produces a visible result
* state changes are controlled and observable

---

 