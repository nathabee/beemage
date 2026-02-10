# BeeMage — Android Wrapper

This directory contains the **Android Studio / Gradle wrapper**
that embeds the BeeMage **Android web bundle** into a native app
using a `WebView`.

This project does **not** build the web application itself.

* **Document updated for version:** `0.2.0`
---

## Responsibility boundary

**This wrapper is responsible for:**

- Hosting the WebView
- Loading assets via `WebViewAssetLoader`
- Enforcing WebView security settings
- Wiring Android lifecycle to the web app
- Handling Android-specific integrations (future)

**This wrapper is NOT responsible for:**

- UI logic
- Image processing
- Pipelines
- Business logic
- Build configuration of the web bundle

All application logic lives in `/src` and `/android`.

---

## Input

The wrapper consumes exactly one thing:

```

android/dist/

```

At build time, this directory is copied into:

```

android-wrapper/app/src/main/assets/

```

Nothing inside `assets/` should be committed
(except `.gitkeep`).

---

## Build order (important)

1. Build the web bundle:
   ```bash
   cd android
   npm run build
```

2. Copy into wrapper (automated):

   ```bash
   android/scripts/build-android.sh
   ```

3. Open `android-wrapper/` in Android Studio

4. Run or build the APK

---

## Asset loading

Assets are served via:

```
https://appassets.androidplatform.net/
```

Using:

* `WebViewAssetLoader`
* `AssetsPathHandler("/")`

This allows:

* `index.html`
* `app/panel.html`
* `assets/*.js`

to resolve naturally without file URLs.

---

## Local configuration

The following files are **machine-local** and must not be committed:

* `local.properties`
* `.gradle/`
* `**/build/`

They are ignored by `.gitignore`.

---

## When you need to touch this directory

You only modify the wrapper when you need:

* Android file import / export
* Camera integration
* Share intents
* Native persistence
* Permissions
* OpenCV via native bindings (future)

If you are working on UI, pipelines, or logic:
**do not touch this directory.**

---

## Primary documentation

Start here:

```
android/README.md
```

That document defines the Android architecture.

```

---
 