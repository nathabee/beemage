# User Manual

**BeeMage — Explore image processing through visual pipelines**
**Version:** v0.1.10

This document explains how to use BeeMage from an end-user perspective.

## Purpose

BeeMage is a browser-based tool (extension panel / demo panel) to:

* load an image locally in the browser,
* run processing pipelines made of small operations,
* preview intermediate and final results (image, mask, or SVG),
* optionally fill regions with color,
* export results and (for advanced users) export logs and pipeline configurations.

All processing happens locally in your browser. No uploads.

## Interface overview

BeeMage is organized into tabs:

* **Image**: load an image and preview the source.
* **Pipeline**: run a pipeline (multiple steps) with live previews per stage and per operation.
* **Builder**: import/export pipeline configurations and manage stored pipelines and recipes; includes a drag-and-drop pipeline playground.
* **Colors**: interactively fill regions with a chosen color palette (based on edge / region detection).
* **Settings**: developer options, engine toggles, tuning, and project info.
* **Logs**: audit log (user-visible history) and debug trace (developer diagnostics).

### Typical workflows

**Run an existing pipeline (most common)**

1. **Image**: load an image.
2. **Pipeline**: select a pipeline + recipe, click **Run all**.
3. **Pipeline**: download the output.

**Create your own pipeline (advanced)**

1. **Image**: load an image.
2. **Builder**: create a pipeline in the playground and save it.
3. **Builder**: (optional) add recipes for the pipeline.
4. **Pipeline**: select your pipeline + recipe, run it, download.

## Image tab

### What it does

* Lets you load an image via drag & drop or file picker.
* Shows the loaded image in an **Input** canvas.

### How to use it

1. Drag & drop an image onto the drop zone, or choose a file using the file input.
2. Confirm the image appears in the **Input** preview.

Note: processing is performed via the **Pipeline** tab (generic pipeline runner).

## Pipeline tab

The Pipeline tab is the core execution UI: a universal pipeline runner with dynamic steps and previews.

### What it does

* Lets you choose a **Pipeline** and a **Recipe**.
* Runs either:

  * the whole pipeline (**Run all**),
  * or one step at a time (**Next step**).
* Shows:

  * **Input (from source)** preview,
  * **Current output** preview (image, mask, or SVG),
  * a detailed **Stages** section with per-stage and per-operation previews.

### Controls

* **Pipeline** (dropdown): selects which pipeline definition to run.
* **Recipe** (dropdown): selects a parameter preset / configuration for the chosen pipeline.
* **Run all**: executes all stages in order.
* **Next step**: advances one step (useful for debugging or understanding the pipeline).
* **Reset**: clears pipeline run state (so you can rerun cleanly).
* **Download**: exports the current output:

  * SVG output is downloaded as `.svg` when present,
  * otherwise image/mask outputs download as `.png`.

Download is enabled only when an output exists.

### Understanding the results display

#### Input (from source)

Shows the input image used by the pipeline (the source image).

#### Current output

Shows the latest available output. Output type is prioritized as:

1. SVG (shown as an `<img>` preview),
2. Image (shown on a canvas),
3. Mask (shown on a canvas; binary masks are rendered for readability).

#### Stages

Each stage is shown as a card with:

* stage title and state (idle/running/done/error),
* stage typing (e.g. `image -> mask`, `mask -> svg`),
* stage error message if any,
* a preview of the stage output artifact (when available),
* a list of operations inside that stage:

  * each operation has an operation card (id, title, IO types),
  * plus its run state and error if any,
  * plus (optionally) its own preview.

This makes the Pipeline tab usable as both an execution tool and a “pipeline inspector”.

### Pipeline-only tuning box

The Pipeline tab also has a **Tuning** section (“Pipeline-only tuning”) that mirrors the central tuning state. Use it to adjust parameters relevant to pipelines without leaving the tab.

## Builder tab

The Builder tab is for pipeline configuration management. In the current UI, it has three major areas:

1. import/export,
2. operations library (filterable),
3. pipeline playground + stored pipelines management.

### Import / Export

At the top:

* **Import**: choose a JSON pipeline configuration file (`.json`).

  * Import triggers automatically when you select the file.
* **Export JSON**: exports pipeline configuration data as JSON.
* **Status**: shows whether the builder is idle or busy.

### Operations library (left column)

A card called **All operations** lists all available operations.

You can filter operations by IO typing:

* **Filter input**: `All | image | mask | svg`
* **Filter output**: `All | image | mask | svg`

Operations are displayed as compact cards and are **draggable**.

### Pipeline playground (right column)

A card called **Pipeline playground** lets you assemble a linear pipeline by drag-and-drop.

#### Draft fields

* **Id**: pipeline id (required).
* **Title**: pipeline title (required).
* **Implemented**: marks whether the pipeline is implemented.
* **Description**: free text.

Buttons:

* **Clear**: removes all operations from the draft.
* **Save pipeline**: validates typing and saves the pipeline to storage.

#### Drag & drop rules (typing)

The playground enforces IO compatibility:

* The pipeline starts with input type **image**.
* Each inserted operation must accept the current type and produce the next type.
* Drop slots display the required type context (what the slot expects and what the next op needs).

If a drop is refused (typing mismatch or missing drag payload), you’ll see a notice message. When debug is enabled, a debug trace entry may also be recorded.

#### Reordering / removing

Each inserted step has:

* **Up**
* **Down**
* **Remove**

### Stored user pipelines (below)

A card called **Stored user pipelines** shows pipelines stored in your browser storage.

Controls:

* **Load example**: selects an example bundle from `assets/pipelines/` and loads it.
* **Filter pipelines**: search by pipeline id or title.
* **Clear**: clears the search filter.

Each pipeline is shown with a management UI, including:

* delete pipeline,
* update pipeline,
* recipe selection,
* add/update/delete recipes.

This area is your “pipeline catalogue” for user-defined pipelines and their recipes.

## Colors tab

### What it does

* Lets you select a palette color.
* Lets you click inside a region to preview its outline.
* Applies a fill to that region.

### How to use it

1. Choose a color from **Palette** (selected color is highlighted).
2. Click inside a region on the canvas to preview the region boundary.
3. If the preview is correct, click **Apply fill**.
4. If the preview is wrong:

   * click **Cancel preview**,
   * adjust edge/noise controls, then click again.

Buttons:

* **Apply fill**: commits the previewed fill (enabled only when a valid preview exists).
* **Cancel preview**: cancels the current preview (enabled only when preview exists).
* **Reset (reload output)**: reloads the underlying output again (discarding fills).

### Edge / noise controls

These controls help prevent leaking through gaps:

* **Edges are dark**: indicates edge polarity.
* **Edge threshold**: which pixels are treated as boundary.
* **Gap close (px)**: dilates edges to close small gaps.
* **Max region (px)**: safety cap to prevent filling huge regions by mistake.

## Settings tab

The Settings tab contains both user-facing and developer-facing controls.

### General

* **Show developer tools (Logs, debug options)**
  Enables developer-only UI such as Logs and debug switches.

### Developer

* **Console trace (developer)**: toggles console tracing.
* Storage limits:

  * Action log max stored entries
  * Debug trace max stored entries
  * Max failure entries per run
* **Debug enabled (OFF wipes all debug traces)**: turning debug off clears debug traces.
* **Reset defaults**: restores default config values.

### Engine

* **OpenCV mode**: demo-only engine toggle. The extension build does not allow injection.
* **Report**: shows OpenCV availability / status after toggling.
* **Notes**: explains runtime availability and per-step selection direction.

### Tuning

Central tuning for engines and parameters. Other tabs may offer shortcuts later, but this is the canonical place.

### About

* Shows the current version.
* Links to the GitHub issues page.

## Logs tab

This tab is intended for diagnostics and transparency.

### Audit log

Controls:

* **Show**: number of entries to display.
* **Refresh**
* **Trim keep last**: keep last N entries.
* **Trim**
* **Export JSON**
* **Clear**

Audit log is the user-visible history (what actions happened).

### Debug trace

Controls:

* **Show**
* **Refresh debug**
* **Export debug JSON**
* **Clear debug**

Debug trace is developer-focused diagnostic data. Availability and retention depend on Settings.

## Data and privacy

* All processing happens locally in your browser.
* No image uploads.
* No background analytics.

## Practical “getting started” workflow

1. **Image**: load an image.
2. **Pipeline**: select a pipeline + recipe, click **Run all**.
3. **Pipeline**: check **Current output** and **Stages** previews to confirm the result.
4. **Pipeline**: click **Download** to export the current output.

---
  