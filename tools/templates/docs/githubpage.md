# GitHub Pages

This project uses **GitHub Pages** to publish:

- project documentation
- a live demo (if provided)

The site is served from the `docs/` directory on the `main` branch.

---

## How GitHub Pages is configured

Files in `docs/` are **not published automatically**.
GitHub Pages must be explicitly enabled in the repository settings.

### Configuration steps

1. Open the GitHub repository for **beemage**
2. Go to **Settings → Pages**
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**

GitHub will then build and publish the site.

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

## Project structure (relevant parts)

```

docs/
├── index.html          # Entry point for GitHub Pages
├── main.js             # Main JavaScript (ES module)
├── style.css           # Global styles
│
├── demo/               # Live demo (optional)
│   └── index.html
│
├── checklist/          # Optional checklist system
│   ├── checklist.js
│   ├── json/
│   └── report/
│
├── presentation.md
├── installation.md
├── architecture.md
├── user-manual.md
└── screenshots/

````

Only the relevant structure is shown here.

---

## How the site works

### Entry point

- `docs/index.html` is the single entry point
- It loads the main JavaScript file as an ES module:

```html
<script type="module" src="main.js"></script>
````

ES modules are required because `main.js` imports other modules.

---

### JavaScript responsibilities

* **`main.js`**

  * navigation between documentation pages
  * dynamic Markdown loading
  * history and anchor handling
  * optional demo panel behavior
  * registration of optional subsystems (for example checklists)

Supporting logic is kept in separate modules to keep `main.js` readable.

---

### Documentation rendering

* Documentation files are written in Markdown (`*.md`)
* Markdown is fetched dynamically and rendered in the browser
* Diagrams (if used) are rendered after content insertion
* Navigation behaves like a small single-page application

---

### Live demo (optional)

If the project includes a demo:

* the demo is delivered under:

  ```
  /docs/demo
  ```
* it is embedded into the documentation UI (for example via `<iframe>`)
* it runs as a **static web application**
* it uses mock or simulated data only

The demo is **not** a browser extension and does not access browser APIs.

---

## Demo build and publishing workflow

The demo is updated as part of the release process.

Typically, the release script:

```
scripts/release-all.sh
```

is responsible for:

* building the extension
* building the demo
* creating ZIP archives for:

  * the extension
  * the demo
* copying the demo’s static output into:

  ```
  /docs/demo
  ```
* committing updated documentation and demo files
* creating a GitHub Release

As a result:

* GitHub Releases contain downloadable ZIP artifacts
* GitHub Pages always reflects the **latest released demo**

---

## Local testing

You cannot open `docs/index.html` directly via `file://`.

The site must be served over HTTP.

### Recommended options

From the repository root:

```bash
npx serve docs
```

or without Node.js:

```bash
cd docs
python3 -m http.server
```

Then open the printed `http://localhost:PORT` URL in a browser.

---

## Summary

* GitHub Pages serves `/docs` from the `main` branch
* `index.html` is the single entry point
* `main.js` orchestrates navigation and UI behavior
* documentation is rendered dynamically from Markdown
* the live demo (if present) is rebuilt and published automatically on release
 