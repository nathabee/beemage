
# BeeMage — Android Native Wrapper Specification

This document describes how the Android web bundle built by:

- `apps/android-web/dist/`

is embedded into the native Android wrapper:

- `apps/android-native/`

The wrapper does not affect `src/`.
All native integration happens outside the shared core.

* **Document updated for version:** `0.2.2`

---

## Goals

The Android wrapper must:

- load the BeeMage web bundle in a WebView
- provide a stable runtime environment
- serve assets safely (no file:// hacks)
- keep BeeMage fully offline and client-side
- optionally expose native features later via a small JS bridge

---

## Non-goals (v1)

- native image processing
- background services
- OpenCV integration
- platform-specific UI rewriting

---

## Wrapper model

BeeMage currently uses a custom Android WebView wrapper (`apps/android-native`) with:

- `WebViewAssetLoader` for safe asset serving
- assets embedded under `app/src/main/assets/`

This keeps dependencies minimal and the execution model explicit.

---

## Responsibility boundary

The wrapper is responsible for:

- hosting the WebView
- loading the web bundle assets
- WebView security posture
- Android lifecycle integration
- optional bridge surface (future)

The wrapper is not responsible for:

- pipeline logic
- UI logic
- image processing
- tuning system
- build configuration of the shared core

All of that remains in `src/` and the `apps/*` web hosts.

---

## Input contract: what the wrapper consumes

The wrapper consumes exactly one artifact:

```

apps/android-native/app/src/main/assets/

```

This directory is populated by:

```bash
./apps/android-web/scripts/build-android-web.sh
```

Nothing in `assets/` should be committed (except `.gitkeep`).

---

## Minimal WebView requirements

The wrapper must:

1. Load the embedded `index.html`
2. Enable:

   * JavaScript
   * DOM storage (localStorage)
3. Support file input (`<input type="file">`)
4. Handle orientation / lifecycle correctly

---

## Asset loading (required)

Production uses `WebViewAssetLoader` and the canonical host:

```
https://appassets.androidplatform.net/
```

This avoids `file://` edge cases and improves security consistency.

---

## JavaScript ↔ Native bridge (future-proof design)

The wrapper may expose an optional bridge object (future), e.g.:

```ts
interface AndroidBridge {
  shareFile?(payload: { name: string; mime: string; dataBase64: string }): Promise<void>;
  saveFile?(payload: { name: string; mime: string; dataBase64: string }): Promise<void>;
}
```

Exposed as:

```ts
window.BeeMageAndroid
```

The BeeMage core must never depend directly on this object.
All access must go through the runtime seam.

---

## Runtime seam extension (future)

Any native feature must be expressed as optional runtime methods in:

* `src/panel/platform/runtime.ts`

For example:

* `runtimeShare(...)`
* `runtimeSaveFile(...)`

Android’s runtime seam implementation can delegate to `window.BeeMageAndroid` when present, otherwise fall back to web behavior.

---

## File export strategy

### v1

* Blob URL + anchor download (acceptable but suboptimal)

### v2

* Android share sheet
* Android file picker save

All routed through runtime seam.

---

## Security model

* no backend required
* no analytics required
* no cloud services
* no cleartext networking requirement for core function
* minimal permissions (typically INTERNET only if needed; otherwise none beyond defaults)

---

## Update strategy

* Web bundle is versioned with BeeMage version
* Wrapper embeds a specific bundle version
* Updates require shipping a new APK/AAB

No remote bundle loading is planned for v1.

---

## Build and release artifacts (stores and F-Droid)

Typical outputs:

* Debug APK (dev loop)
* Release APK (useful for testing / F-Droid workflows)
* Release AAB (required for Google Play)

These should be produced deterministically by:

* `apps/android-native/scripts/build-android-native.sh`

Store signing must be handled via standard Gradle signing configs (keystore), and should be CI-friendly (env vars / non-interactive).

---

## Testing checklist

Before shipping:

* load image from gallery
* run a full pipeline
* preview outputs
* export SVG / PNG
* rotate device
* background / foreground app
* test on a lower-memory device if possible
* check WebView console via `chrome://inspect`

---

## Summary

* `apps/android-web` builds the web artifact
* `apps/android-native` embeds it unchanged
* platform-specific features live outside `src/`
* core stays single-source and seam-driven

This separation is intentional and must be preserved.
 