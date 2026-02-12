# BeeMage Demo App

This directory (`apps/demo`) builds and serves the BeeMage UI as a **standalone static web application**.

It reuses the **same shared application core** from the repository root:

- `src/` (shared panel UI + pipeline system)
- `assets/` (pipelines JSON, icons, optional runtimes)

The demo is primarily used for:

- public GitHub Pages demo (`docs/demo`)
- documentation and reproducible examples
- testing the UI without extension or Android constraints

*Document updated for version:* `0.2.1`

---

## What the demo does

The demo runs the real BeeMage panel code in a normal web page by doing two things at build/dev time:

1) **Seam swapping** (replace extension-only modules with demo mocks)
2) **Panel asset serving/emitting** (serve/emit the real `panel.html` + `panel.css`)

The result is a normal static web build that contains:

- the real BeeMage UI
- the real pipeline engine (native TypeScript ops)
- no Chrome extension APIs

---

## Repository layout assumptions

This demo expects the repository to look like this:

```

/src                         shared BeeMage application core
/assets                      shared assets (pipelines, icons, etc.)
/docs                        documentation + GitHub Pages output
/apps
/demo                      this demo host project (Vite)
/extension                 Chrome extension host project (esbuild)
/android-web               Android web bundle host project (Vite)
/android-native            Android wrapper (Gradle project)

```

---

## Seam swapping

The demo must not import Chrome extension APIs at all.

At build time, `apps/demo/vite.config.ts` swaps these modules:

| Shared module (repo root)                      | Demo replacement (apps/demo)                       |
|-----------------------------------------------|----------------------------------------------------|
| `src/panel/platform/runtime.ts`               | `apps/demo/src/mocks/runtime.ts`                   |
| `src/shared/platform/storage.ts`             | `apps/demo/src/mocks/storage.ts`                   |
| `src/panel/platform/engineAdapter.ts`        | `apps/demo/src/mocks/engine/engineAdapter.ts`      |
| `src/panel/platform/opsDispatchImpl.ts`      | `apps/demo/src/mocks/engine/opsDispatchImpl.ts`    |

Notes:

- This keeps the demo build clean of extension-only dependencies.
- The swap happens via a Vite `resolveId` plugin (see `vite.config.ts`).

---

## Panel UI assets

The demo serves and emits the real panel HTML/CSS from the shared codebase:

- Source of truth:
  - `src/panel/panel.html`
  - `src/panel/panel.css`

- In the demo build, they are exposed as:
  - `__app/panel.html`
  - `__app/panel.css`

This is handled by the `panelAssetsPlugin()` in `apps/demo/vite.config.ts`.

---

## OpenCV runtime (web demo)

The demo supports OpenCV (WASM) for experimentation.

The build ensures OpenCV runtime files exist under:

```

apps/demo/public/assets/opencv/
opencv.js
opencv.wasm

```

Source selection:

1) Preferred: committed runtime under `docs/assets/opencv/` (reproducible builds)
2) Fallback: `apps/demo/node_modules/@opencv.js/wasm/`

The copy is enforced by `ensureOpenCvPublicPlugin()` in `vite.config.ts`.

### When to run get-opencv.sh

`apps/demo/scripts/get-opencv.sh` is a convenience script to sync the runtime into:

- `docs/assets/opencv/` (committed canonical runtime, good for CI and GitHub Pages)
- `apps/demo/public/assets/opencv/` (generated demo runtime)

Run it when:

- you upgrade `@opencv.js/wasm`
- you want the committed runtime updated
- you want reproducible builds without relying on node_modules layout

---

## Pipeline JSON assets

Pipeline examples are treated as shared assets.

Source of truth:

```
assets/pipelines/**/*.json
```

Before build/dev, the demo copies them into:

```
apps/demo/public/assets/pipelines/
```

Then Vite copies `public/` into `dist/`, so they end up in:

```
apps/demo/dist/assets/pipelines/
```

This is enforced by `ensurePipelinesPublicPlugin()` in `vite.config.ts`.

---

## What this demo is (and is not)

- Interactive BeeMage UI in a standard browser
- Uses the real shared panel code from `src/`
- No extension APIs (runtime/storage/engine seams are mocked)
- Not connected to any third-party account
- Does not access cookies, sessions, or credentials

---

## Local development

All commands below run from the repository root unless specified.

### Install

```bash
cd apps/demo
npm install
```

### Dev mode (hot reload)

```bash
cd apps/demo
npm run dev -- --host
```

Vite prints a URL. Open it in your browser.

### Production build + preview

```bash
cd apps/demo
npm run build
npm run preview -- --host
```

### Extra strict: static server only

```bash
cd apps/demo
npm run build
npx serve dist
```

If it works here, it will work as pure static files (VPS / GitHub Pages).

---

## Scripts in this directory

`apps/demo/scripts/` contains:

* `build-demo.sh`
  Installs + builds the demo (typically used by higher-level release scripts)

* `build-demo-zip.sh`
  Builds and produces a versioned zip in `/release`

* `get-opencv.sh`
  Syncs OpenCV runtime into `docs/assets/opencv` and `apps/demo/public/assets/opencv`

* `publish-demo-zip.sh`
  Uploads the demo zip to the GitHub Release matching the current tag/version

* `install-web.sh`
  Helper for deploying the built static demo zip into another web root (optional workflow)

---

## How the demo is published to GitHub Pages

The public demo is hosted from:

```
docs/demo/
```

Your release workflow typically does:

1. Build `apps/demo/dist`
2. Sync `apps/demo/dist/` into `docs/demo/` (diff-aware)
3. Commit + push `docs/demo`
4. Optionally upload `beemage-demo-<version>.zip` into the GitHub Release

In your repository, the orchestrator for this is the root script:

```
scripts/release-all.sh
```

That script coordinates extension + demo builds and keeps GitHub Pages aligned with the same version tag.

---

## Output

Build output:

```
apps/demo/dist/
  index.html
  __app/
    panel.html
    panel.css
  assets/
    *.js
    opencv/               (if enabled/available)
    pipelines/*.json
```

---

## Troubleshooting

### Pipeline JSON assets not found

If you see:

```
Pipeline JSON assets not found.
Expected directory:
- <repoRoot>/assets/pipelines
```

Then you are missing the shared pipelines directory in the repository root.

Fix:

```bash
mkdir -p assets/pipelines
# add at least one *.json pipeline file
```

### OpenCV runtime not found

If you see:

```
OpenCV runtime not found.
Expected either:
- docs/assets/opencv/opencv.{js,wasm}
- node_modules/@opencv.js/wasm/opencv.{js,wasm}
```

Fix:

```bash
cd apps/demo
npm install
./scripts/get-opencv.sh
```
 