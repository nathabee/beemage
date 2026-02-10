# BeeMage — Android Web Bundle

This directory builds the **Android-targeted web bundle** for BeeMage.

It reuses the **same application core and UI** as the Chrome Extension (`/src`)
and produces a **static web build** that is embedded into an Android app
via a WebView-based wrapper.

This is **not** the Android APK.
It is the **web artifact** consumed by the Android wrapper.

* **Document updated for version:** `0.2.0`

---

## Purpose

The Android web build exists to:

- reuse `/src` without modification
- remove all Chrome Extension APIs at build time
- run BeeMage in a standard Android WebView
- keep all image processing client-side (no backend)

OpenCV is **intentionally disabled** in Android v1.

---

## Architecture summary

- `/src` remains the **single source of truth**
- `/android` is a **Vite host project**
- build-time seam swapping replaces extension-only modules
- native JS pipeline operations are reused unchanged

```

/src                  ← shared application core
/android               ← Android web host
├─ index.html
├─ src/main.ts
├─ src/app.ts
├─ src/mocks/*         ← Android platform seams
└─ vite.config.ts

````

---

## What is reused from `/src`

- Panel UI (`panel.html`, `panel.css`, `panel.ts`)
- All tabs and view models
- Pipeline runner and typing system
- Native JS operation implementations
- Logging model (action log / debug trace / console trace)

---

## What is replaced for Android

At build time, these modules are swapped:

| Original (`/src`)                         | Android replacement (`/android`) |
|------------------------------------------|----------------------------------|
| `panel/platform/runtime.ts`              | `src/mocks/runtime.ts`           |
| `shared/platform/storage.ts`             | `src/mocks/storage.ts`           |
| `panel/platform/engineAdapter.ts`        | `src/mocks/engine/engineAdapter.ts` |

No other modules are replaced.

**`opsDispatchImpl.ts` is NOT swapped.**  
Android uses the same native JS operations as the extension build.

---

## OpenCV status

- OpenCV is **disabled** in the Android build
- `supportsOpenCvLoad()` returns `false`
- Any OpenCV request falls back to native JS implementations
- No OpenCV assets are bundled

This avoids WebView constraints and keeps v1 intentionally simple.

---

## Install

```bash
cd android
npm install
````

---

## Build

```bash
npm run build
```

Build output:

```
android/dist/
├─ index.html
├─ app/
│  ├─ panel.html
│  └─ panel.css
└─ assets/
   ├─ *.js
   └─ pipelines/*.json
```

This directory is the **only input** consumed by the Android wrapper.

---

## Development server

```bash
npm run dev
```

Notes:

* Runs in a standard browser or WebView
* No Chrome APIs required
* `--host` is enabled to allow testing from a physical Android device

---

## Assets

### Panel HTML / CSS

* Sourced from `/src/panel/panel.html` and `panel.css`
* Sanitized at build time (extension scripts removed)
* Emitted as:

```
app/panel.html
app/panel.css
```

### Pipeline JSON files

* Sourced from:

```
assets/pipelines/**/*.json
```

* Bundled as:

```
assets/pipelines/
```

---

## Persistence

* Uses `localStorage` via the Android storage mock
* Persists:

  * user pipelines / recipes
  * tuning overrides
  * UI state
* Images are **not** persisted

---

## Known limitations (v1)

* File export uses browser-style downloads
* No Android share / save integration yet
* No camera import
* No OpenCV acceleration

These are handled at the wrapper layer.

---

## What this directory is NOT

* Not an Android Studio project
* Not an APK
* Not a Capacitor / Cordova project
* Not tied to the Android SDK

It is a **pure web artifact**, by design.

---

## Next step

See: `android-wrapper/README.md`

That document explains how this bundle is embedded
into a real Android application.

 