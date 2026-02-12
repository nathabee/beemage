# Developer Guide

**BeeMage — Explore image processing through visual pipelines**  
* **Document updated for version:** `0.2.2`

This document describes the development workflow for BeeMage:
how the repository is structured, where code lives, and how builds/releases are produced.

Installation and testing procedures are documented separately:

- Testing: `docs/tester.md`
- Architecture: `docs/architecture.md`

---

## 1. Repository layout

BeeMage uses one shared application core and multiple runtime hosts.

```

src/                      shared application core (UI + pipelines + logic)
assets/                   shared assets (pipelines, etc.)
apps/
demo/                   web demo host (Vite) + seam swapping + optional OpenCV
extension/              Chrome extension host (MV3) + esbuild bundling
android-web/            Android web bundle host (Vite) + seam swapping (no OpenCV)
android-native/         Android Studio / Gradle wrapper (WebView)
docs/                     GitHub Pages site + documentation (includes docs/demo)
scripts/                  repo-level workflows (versioning, release orchestration)
release/                  generated artifacts (zips/apks/aabs)

```

Key principle:

- `/src` remains the single source of truth for UI + pipeline logic.
- `/apps/*` contain platform seams, build tooling, and wrappers.

---

## 2. Core development rules

- Do not introduce Chrome APIs into shared core (`/src`).
- Do not introduce OpenCV/WASM into extension runtime.
- Platform-specific behavior must be isolated via seam swapping in `/apps/*`.
- Respect the logging split:
  - `traceScope` for dev console only
  - `debugTrace.append` for persisted developer diagnostics
  - `actionLog.append` for user-visible audit history

---

## 3. Local development

### 3.1 Web demo (apps/demo)

```bash
cd apps/demo
npm install
npm run dev -- --host
```

### 3.2 Extension (apps/extension)

```bash
cd apps/extension
npm install
npm run build
```

Load unpacked from:

```
apps/extension/dist/
```

### 3.3 Android

1. Build Android web bundle and sync into wrapper assets:

```bash
./apps/android-web/scripts/build-android-web.sh
```

2. Build Android native artifacts:

```bash
./apps/android-native/scripts/build-android-native.sh apk debug
```

---

## 4. Versioning

BeeMage uses a root `VERSION` file as the single source of truth.

### 4.1 Bump version

```bash
./scripts/bump-version.sh
```

This updates version fields where applicable (extension manifest/package, demo package, android-web package, etc.)
and stages the version-related files.

### 4.2 Commit

```bash
git add -A
git status
git commit -m "vX.Y.Z — <short description>"
```

---

## 5. Release workflow

The canonical release entry point is:

```bash
./scripts/release-all.sh
```

It typically performs:

* build extension ZIP
* build demo ZIP
* build android-web bundle and sync into wrapper assets
* build android-native APK/AAB into `/release`
* publish demo to `docs/demo` (GitHub Pages)
* create Git tag + GitHub release
* optionally upload demo zip and android artifacts

The script enforces a clean working tree (except for known generated paths).

---

## 6. Documentation map

| Topic           | Document               |
| --------------- | ---------------------- |
| Testing         | `docs/tester.md`       |
| Architecture    | `docs/architecture.md` |
| Installation    | `docs/installation.md` |
| Version history | `docs/version.md`      |

---
