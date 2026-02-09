# Developer Guide

**BeeMage — Explore image processing through visual pipelines**  
**Applies to:** extension + static web demo  
* **Document updated for version:** `0.1.11`

This document describes the **development workflow** for BeeMage:
where code lives, how changes are organized, how versions are produced,
and how releases are made.

Installation, build, and testing procedures are documented separately and
are referenced where needed.

---

## 1. Code organization

BeeMage is delivered through two formats that share the same UI and core logic:

1. **Chrome Extension (MV3, Side Panel)**
2. **Static Web Demo (Vite, GitHub Pages)**

The demo is **not a separate application**.  
It runs the same panel code and replaces platform seams at build time.

### Shared code (extension + demo)

Most development happens in:

```

src/

```

Key areas:

* `src/panel/` — panel UI, tabs, pipeline system, tuning
* `src/shared/` — storage, logging, messages, versioning

Changes here affect **both** delivery formats.

### Demo-specific code (web-only)

Demo-only behavior lives in:

```

demo/src/mocks/

```

This includes:

* runtime abstraction
* storage abstraction
* OpenCV-backed engine implementations

If functionality must exist **only in the demo**, it belongs here.

---

## 2. Development rules

* Do **not** introduce Chrome APIs into shared code.
* Do **not** introduce OpenCV or WASM into extension runtime.
* Demo-only capabilities must be implemented via seam swapping.
* Extension runtime must remain MV3-safe and CSP-compatible.

---

## 3. Local development and testing

Installation, build, and test procedures are documented in:

* **Installation:** `docs/installation.md`
* **Testing:** `docs/tester.md`

Use those documents as the source of truth.

---

## 4. Versioning workflow

BeeMage uses a `VERSION` file as the single source of truth.

### 4.1 Bump version

```bash
./scripts/bump-version.sh
```

### 4.2 Implement changes

* Shared changes → `src/`
* Demo-only changes → `demo/src/mocks/`


### 4.3 Version documentation (automatic)

The file:

```
docs/version.md
```

contains an **Activity Overview** section that is **auto-generated from Git history**.

This section is regenerated on **every commit** via a repository-local **Git pre-commit hook**.
The hook runs:

```
scripts/version-commited.sh
```

and automatically stages `docs/version.md` if it changes.

Developers **must not manually edit** the generated section
(delimited by `VERSION_ACTIVITY_START / END` markers).

To enable hooks after cloning the repository, run once:

```bash
./scripts/install-githooks.sh
```

---

### 4.4 Commit

After implementing changes, commit as usual:

```bash
git add -A
git status
git commit -m "vX.Y.Z — <short description>"
```

The commit will automatically include any updates to `docs/version.md`
produced by the pre-commit hook.


---

## 5. Release workflow

Releases are built and published via a single entry point:

```bash
./scripts/release-all.sh
```

This script:

* builds the extension artifact
* builds the demo
* publishes the demo to `docs/demo` (GitHub Pages)
* creates the Git tag and GitHub release artifacts

The script enforces a clean working tree before running.

---

## 6. Responsibilities summary

| Area            | Document               |
| --------------- | ---------------------- |
| Installation    | `docs/installation.md` |
| Testing         | `docs/tester.md`       |
| Architecture    | `docs/architecture.md` |
| Developer flow  | `docs/developer.md`    |
| Version history | `docs/version.md`      |

---

 