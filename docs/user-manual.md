# User Manual

**BeeContour — Extract the main outline**

This document explains how to use **BeeContour — Extract the main outline** from an end-user perspective.

---

## Purpose

**BeeContour — Extract the main outline** is a browser extension that allows you to:

* extract clean contour outlines from images,
* preview the result directly in the extension panel,
* download the processed contour image,
* optionally color specific regions inside the detected contours.

All processing happens **locally in your browser**.
No images or data are sent to external servers.

---

## Installation

You can install BeeContour in one of the following ways:

* **Chrome Web Store** (once published)
* **Manual installation** in Chrome developer mode (for testing or development)

Refer to the installation guide for detailed steps.

---

## Interface Overview

The BeeContour panel is organized into **tabs**, each with a clear role:

* **Contour** — load an image and generate its contour outline
* **Colors** — interactively color regions inside the contour result
* **Settings** — optional developer and configuration options
* **Logs** — diagnostic and audit information (mainly for advanced users)

A typical workflow uses **Contour → Colors → Download**.

---

## Typical Workflow (Recommended)

1. Open the **Contour** tab
2. Load an image and generate the contour output
3. (Optional) Switch to the **Colors** tab to color regions
4. Download the final image

Each step is described in detail below.

---

## Contour Tab — Extracting the Outline

The **Contour** tab is the starting point of the workflow.

### What this tab does

* Accepts an image (drag & drop or file selection)
* Displays the input image
* Generates a contour-style output image
* Allows downloading the generated outline

### How to use it

1. **Load an image**

   * Drag & drop an image into the drop zone
     **or**
   * Click the file input to select an image from your computer

2. **Preview**

   * The original image is shown in the *Input* canvas

3. **Adjust options (optional)**

   * **Edge threshold**: controls how strong edges must be to be detected
     Higher values → fewer edges
     Lower values → more edges
   * **White background**: toggles background/foreground polarity

4. **Process**

   * Click **Process**
   * The extension computes the contour outline
   * The result appears in the *Output* canvas

5. **Download**

   * Click **Download PNG** to save the contour image

At this point, the contour output is available to other tabs.

---

## Colors Tab — Coloring Regions Inside the Contour

The **Colors** tab allows you to interactively color regions inside the contour output.

> This step is optional.
> You can skip it if you only need the contour outline.

### What this tab does

* Displays the latest contour output
* Lets you select a color palette
* Allows clicking inside regions to preview fills
* Applies color fills inside closed contour regions

### Initial behavior

* When you open the **Colors** tab **for the first time**, it automatically loads the latest contour output (if available).
* If no contour output exists yet, the tab will indicate that processing is required first.

### Palette selection

* A predefined palette of colors is displayed
* Click a color to select it
* The selected color is visually highlighted

### Region selection and preview

1. Click **inside** a region bounded by contour lines
2. The extension detects the region
3. A **red outline preview** shows the area that will be filled
4. If the preview is correct:

   * Click **Apply fill**
5. If the preview is incorrect:

   * Click **Cancel preview**
   * Adjust noise/edge settings or click another area

### Noise and edge controls

These controls help avoid accidental filling of large areas due to small gaps in contours:

* **Edges are dark**
  Indicates whether contours are dark on a light background (default)
* **Edge threshold**
  Controls which pixels are treated as contour boundaries
* **Gap close (px)**
  Artificially thickens edges to close small gaps
* **Max region (px)**
  Safety limit to prevent filling extremely large regions

### Reset (reload output)

* **Reset (reload output)** discards all color changes
* Reloads the original contour output from the Contour tab
* Useful if you want to start coloring again from scratch

### State behavior

* Color changes remain visible while you stay in the Colors tab
* Switching to another tab and back keeps your current colored result
* The result only resets if you explicitly click **Reset**

---

## Settings Tab — Configuration

The **Settings** tab provides optional configuration options.

Typical users do not need to change anything here.

Depending on build configuration, this tab may include:

* Developer options
* Logging and debug toggles
* Version and project information

---

## Logs Tab — Diagnostics

The **Logs** tab is intended for advanced users and developers.

It can show:

* Internal actions performed by the extension
* Debug traces
* Audit information

This tab does **not** affect image processing or results.

---

## Data & Privacy

* All image processing is performed **locally**
* No images are uploaded
* No personal data is collected
* No background analytics or tracking

BeeContour is fully client-side and transparent in behavior.

---

## Summary

**BeeContour — Extract the main outline** is designed for a simple, predictable workflow:

1. **Contour tab** → generate a clean outline
2. **Colors tab** → optionally color regions
3. **Download** → export the result

The extension favors explicit user actions, clear previews, and local processing.

--- 