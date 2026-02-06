# BeeMage — Extract the main outline

**BeeMage extracts clean image outlines from images directly in your browser and lets you optionally color regions inside those contours.**
It works best with **high-contrast subjects** such as trees, drawings, silhouettes, or scanned artwork.

BeeMage is a **Chrome Extension built on Manifest V3**.
All processing happens **locally in the browser**, with no backend and no external data transfer.

* Project code: `beemage`
* Current version: `0.0.3`
* Homepage: [https://nathabee.github.io/beemage/](https://nathabee.github.io/beemage/)
* Support / Issues: [https://github.com/nathabee/beemage/issues](https://github.com/nathabee/beemage/issues)

---

## What BeeMage does

BeeMage provides a simple, explicit workflow:

1. Load an image
2. Extract its main image outline
3. (Optional) Color regions inside the detected contours
4. Download the result as a PNG

The extension is designed for **visual exploration and manual refinement**, not automated batch processing.

---

## Key Features

### image extraction

* Drag & drop or file input
* Live preview of the source image
* Adjustable edge detection threshold
* Inverted background option (white / black)
* Downloadable PNG output

### Region-based coloring

* Interactive coloring inside closed image regions
* Click-to-preview region detection with visual outline
* Predefined color palette
* Noise and gap handling controls to prevent accidental large fills
* Explicit apply / cancel actions

### Local-only processing

* No image upload
* No network calls
* No tracking or analytics
* Fully client-side execution

---

## Typical Use Cases

BeeMage is useful for:

* Preparing outlines for illustration or graphic design
* Extracting tree branches, silhouettes, or line art
* Creating coloring bases from photos or scans
* Educational or exploratory image processing
* Prototyping visual workflows inside the browser

It is **not** intended as a replacement for full image editing software, but as a focused, lightweight tool.

---

## Project Philosophy

BeeMage follows a few clear principles:

* **Explicit actions over automation**
  Nothing happens without user intent (process, apply, reset).
* **Visual feedback first**
  Every operation provides a preview before modification.
* **Simple state model**
  Tabs share output only when needed; user edits are never overwritten implicitly.
* **Minimal dependencies**
  No frameworks, no backend, no hidden complexity.

---

## Technical Overview (high level)

* Chrome Extension (Manifest V3)
* Panel-based UI with tab navigation
* Canvas-based image processing
* Modular tab architecture:

  * image
  * Colors
  * Settings
  * Logs
* Designed to be inspectable and extensible

---

## Current Status

BeeMage is in an **early development phase**.

* Core image extraction is functional
* Region coloring workflow is implemented
* API and UI are still evolving
* Feedback and testing are welcome

See the **version history** and **user manual** for details on implemented features.

---

## License

See the `LICENSE` file at the repository root.

---
 