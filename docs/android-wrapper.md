# BeeMage — Android Wrapper Specification

This document describes how the **Android web bundle**
(`android/dist`) is embedded into a **native Android application**.

It does **not** affect the BeeMage core or `/src`.
All native integration happens outside the shared codebase.


* **Document updated for version:** `0.2.0`


---

## Goals

The Android wrapper must:

- load the BeeMage web bundle in a WebView
- provide a stable runtime environment
- optionally expose native features via a JS bridge
- keep BeeMage fully offline and client-side

---

## Non-goals (v1)

- native image processing
- background services
- OpenCV integration
- platform-specific UI rewriting

---

## Wrapper models

Two wrapper strategies are acceptable.

### Option A — Capacitor (recommended)

**Pros**
- fast setup
- maintained ecosystem
- built-in bridge (Share, Files, Permissions)
- good long-term evolution path

**Cons**
- additional tooling
- slightly larger footprint

### Option B — Custom Android WebView

**Pros**
- minimal dependencies
- full control

**Cons**
- manual JS bridge
- more boilerplate
- more maintenance

Both approaches consume the **same web bundle**.

---

## Minimal wrapper requirements

Regardless of approach, the wrapper must:

1. Load `android/dist/index.html` into a WebView
2. Enable:
   - JavaScript
   - localStorage
3. Allow file input (`<input type="file">`)
4. Handle orientation / lifecycle correctly

---

## WebView configuration (baseline)

```kotlin
webView.settings.javaScriptEnabled = true
webView.settings.domStorageEnabled = true
webView.settings.allowFileAccess = true
webView.settings.allowContentAccess = true
```

For development builds:

* enable WebView debugging

---

## Asset loading

Two common approaches:

### A. Bundle assets inside APK

* copy `android/dist/*` into `assets/`
* load via `file:///android_asset/index.html`

### B. Load from local server (dev only)

* use `npm run dev`
* load via `http://<host>:5173`

Production should always use **bundled assets**.

---

## JavaScript ↔ Native bridge (future-proof design)

The wrapper **may** expose a small JS API.
This must be optional and non-breaking.

### Recommended bridge surface (v1+)

```ts
interface AndroidBridge {
  shareFile?(payload: {
    name: string;
    mime: string;
    dataBase64: string;
  }): Promise<void>;

  saveFile?(payload: {
    name: string;
    mime: string;
    dataBase64: string;
  }): Promise<void>;
}
```

Exposed on:

```ts
window.BeeMageAndroid
```

BeeMage core must **never** depend directly on this object.
Access must go through the runtime seam.

---

## Runtime seam extension (future)

When native features are added, extend:

```
src/panel/platform/runtime.ts
```

With optional methods:

* `runtimeShare(...)`
* `runtimeSaveFile(...)`

Android runtime mock will delegate to `window.BeeMageAndroid`
when available, otherwise fall back to browser behavior.

---

## File export strategy

### v1

* Blob URL / anchor download
* acceptable but suboptimal UX

### v2

* Android share sheet
* Android file picker save

All logic routed through runtime seam.

---

## Performance considerations

* Mobile memory is limited
* Avoid retaining large intermediate images
* Prefer resizing early in pipelines
* Consider mobile defaults for tuning presets

These are application-level policies, not wrapper concerns.

---

## Security model

* No network access required
* No backend
* No permissions beyond file access (optional)
* All processing is local

---

## Update strategy

* Web bundle versioned with BeeMage version
* Wrapper embeds a specific `android/dist` build
* Updates require shipping a new APK (v1)

Future options:

* bundled updater
* remote bundle loading (not planned)

---

## Testing checklist

Before shipping:

* load image from gallery
* run full pipeline
* preview outputs
* export SVG / image
* rotate device
* background / foreground app
* low-memory device test

---

## Summary

* `/android` builds the web artifact
* Android wrapper embeds it unchanged
* platform-specific features live **outside** `/src`
* BeeMage remains a single-core, multi-delivery application

This separation is intentional and must be preserved.
