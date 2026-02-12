# GitHub Pages

**BeeMage — Explore image processing through visual pipelines**  
* **Document updated for version:** `0.2.2`

This project uses **GitHub Pages** to publish:

- project documentation
- a live web demo (static build)

The site is served from the `docs/` directory on the `main` branch.
 

---

## How GitHub Pages is configured

Files in `docs/` are **not published automatically** unless GitHub Pages is enabled
in the repository settings.

### Configuration steps

1. Open the GitHub repository for **beemage**
2. Go to **Settings → Pages**
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**

GitHub will then publish the site.

### Verification

In the **Pages** settings screen, GitHub shows:

- the published site URL
- the current build status (for example: “Your site is being built”)

In the **Actions** tab, a workflow named  
**Pages build and deployment** appears for each update.

If the site shows “There is nothing at this address”, verify:

- Pages is configured to publish from `/docs`
- `docs/index.html` exists (case-sensitive)
- the repository is public (or Pages is enabled for private repos on your plan)

---

## Project structure relevant to Pages

GitHub Pages only serves the `docs/` directory.  
The application builds happen under `apps/*` and are copied into `docs/` only when needed.

```

docs/
├── index.html                 # Entry point for the documentation UI
├── main.js                    # Documentation SPA loader (ES module)
├── style.css                  # Global styles
│
├── demo/                      # Live demo published to Pages (generated)
│   ├── index.html
│   ├── assets/
│   └── app/
│
├── assets/                    # Runtime assets used by Pages content/demo
│   ├── opencv/                # OpenCV runtime for the demo (if used)
│   └── pipelines/             # Example pipeline JSON files (published)
│
├── installation.md
├── architecture.md
├── android.md                 # Android build spec (docs only)
├── android-wrapper.md         # Wrapper spec (docs only)
├── tester.md
└── screenshots/

```


---

## How the site works

### Entry point

- `docs/index.html` is the single entry point
- It loads the documentation UI as an ES module:

```html
<script type="module" src="main.js"></script>
```

### Documentation rendering

* Documentation files are Markdown (`*.md`)
* Markdown is fetched dynamically and rendered client-side
* Navigation behaves like a small single-page application

### Live demo embedding

If the project includes a demo:

* the demo is published under `docs/demo/`
* it can be embedded into the documentation UI (for example via `<iframe src="./demo/">`)
* it runs as a static web application
* it uses web-compatible platform seams (no extension APIs)

---

## Demo build and publishing workflow

The web demo is built from:

* `apps/demo/` (Vite host)
* shared core code from `src/`

Build output:

* `apps/demo/dist/` (local preview)
* published to `docs/demo/` (GitHub Pages)

The release workflow uses:

```
scripts/release-all.sh
```

This script typically performs:

1. Build extension zip:

   * output: `release/beemage-<ver>.zip`

2. Build demo zip:

   * output: `release/beemage-demo-<ver>.zip`

3. Publish the web demo to Pages:

   * copies `apps/demo/dist/` into `docs/demo/`
   * syncs shared runtime assets into `docs/assets/`:

     * `assets/opencv/` -> `docs/assets/opencv/` (if present)
     * `assets/pipelines/` -> `docs/assets/pipelines/` (if present)

4. Commit and push `docs/*` updates (only if changed)

5. Create/update GitHub Release and upload artifacts:

   * extension zip is uploaded by default
   * demo zip upload is optional
   * Android artifact upload is optional

Result:

* GitHub Pages reflects the latest published `docs/` content
* GitHub Releases contain downloadable build artifacts

---


## Local testing

You cannot open `docs/index.html` directly via `file://`.
Serve it over HTTP.

From repository root:

```bash
npx serve docs
```

Or without Node.js:

```bash
cd docs
python3 -m http.server
```

Then open the printed `http://localhost:PORT` URL.

---

## Summary

* GitHub Pages serves `/docs` from the `main` branch
* `docs/index.html` is the single entry point for documentation
* `docs/demo/` is a generated static demo published from `apps/demo/dist`
* `docs/assets/` contains runtime assets published for the demo (opencv/pipelines)
* Android APK/AAB are release artifacts and are not published via GitHub Pages

```
 