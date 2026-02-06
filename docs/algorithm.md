# clean algorithm 


## overview final **6-stage pipeline**  algorithm :

the  **6-stage pipeline** that goes from raster edges → vector SVG.

 

---

## What is implemented **now** (truth, not theory)

### Current input

* **Input = Stage 0**
* The **Output canvas** of `Process()` (Sobel + threshold)

This is exactly as planned.

---

## Clean1 (what it really is now)

### Clean1 = **merged Stage 1 + part of Stage 2**

Clean1 currently performs:

### ✔ Stage 1 — Binarize + denoise (FULLY DONE)

* Binary mask extracted from output (edge = 1, background = 0)
* Explicit handling of black-on-white vs white-on-black
* **Connected component filtering**:

  * Removes very small components (salt-and-pepper noise)

This corresponds **exactly** to:

> Stage 1 — Binarize + denoise
> Convert to grayscale, threshold
> Optional: remove very small connected components

So **Stage 1 is complete** and visible in Clean1.

---

### ✔ Stage 2 — Repair gaps (PARTIALLY DONE)

In Clean1 we already apply:

* **Morphological closing** (dilation → erosion, 3×3 kernel)

That means:

* small gaps are bridged
* short breaks are closed
* strokes become more continuous

So Clean1 is **not just binarization** — it is already a *“repaired binary mask”*.

That is why Clean1 already looks “stronger” than Output.

---

### ❌ What is NOT in Clean1 (yet)

* Directional closing (H/V/diagonal)
* Endpoint detection + targeted bridging

Those are **more advanced gap-repair strategies** and are intentionally **not done yet** because:

* generic closing is the safest first step
* endpoint bridging requires skeleton logic

---

## Clean2 (what it really is now)

### Clean2 = **Stage 2 continuation + Stage 3 (lite)**

Clean2 applies **morphology again**, but in a different order:

### ✔ Spur & noise suppression (Stage 3 — partial)

* **Opening** (erosion → dilation):

  * removes tiny spikes
  * removes hair-like protrusions
* Followed by a **light re-closing**:

  * restores continuity after erosion

This is effectively a **“soft prune”**, not a true skeleton prune.

So Clean2 corresponds to:

> Stage 3 — Thin + prune
> Remove short branches (“spikes”)

…but **without skeletonization**.

Why no skeleton yet?

* Skeletonization is expensive
* It is only *necessary* once we go to **centerline tracing**
* For SVG **outline** tracing, it is optional

So: **Stage 3 is partially implemented**, intentionally simplified.

---

## What has NOT been implemented yet (on purpose)

### ❌ Skeletonization (Stage 3 full)

Not done yet:

* Zhang–Suen / Guo–Hall thinning
* Endpoint-based pruning

Reason:

* only needed for centerline-based vectorization
* adds complexity before we validate earlier steps

---

### ❌ image tracing → polylines (Stage 4)

Not done yet:

* marching squares
* border following
* skeleton graph tracing

This is the **first true vector step**. We have not reached vector space yet.

---

### ❌ Simplify + smooth polylines (Stage 5)

Not done yet:

* RDP
* Chaikin
* spline fitting

This cannot happen before Stage 4 exists.

---

### ❌ SVG emission (Stage 6)

Not done yet — intentionally last.

---

## Summary table (very important)

| Planned Stage                      | Status         | Where it lives now        |
| ---------------------------------- | -------------- | ------------------------- |
| Stage 0 – Input                    | DONE           | Output canvas             |
| Stage 1 – Binarize + denoise       | DONE           | Clean1                    |
| Stage 2 – Repair gaps              | PARTIAL        | Clean1 (+ some in Clean2) |
| Stage 3 – Thin + prune             | PARTIAL (lite) | Clean2                    |
| Stage 4 – Trace contours           | ❌ Not yet      | —                         |
| Stage 5 – Simplify + smooth curves | ❌ Not yet      | —                         |
| Stage 6 – SVG primitives           | ❌ Not yet      | —                         |

---

## Why Clean1 and Clean2 look “close” right now

Because:

* we are still in **raster space**
* both stages are morphological
* no topology change yet (no tracing, no skeleton)

The **real visual jump** will happen at:

* Stage 4 (raster → geometry)
* Stage 5 (geometry → curves)

Until then, differences are subtle but structurally important.

---

## Why this ordering is correct (and not premature)

You are doing this **the right way**:

1. First stabilize the raster (Clean1 / Clean2)
2. Then convert to geometry once noise is under control
3. Then smooth geometry (not pixels)
4. Then reuse the same prepared raster later for **FillPrep**

If you skip these steps and jump straight to SVG, you will regret it later.

---

## What the **next logical step** should be (when you are ready)

Not skeleton yet.

Next step should be:

> **Stage 4a — Marching squares image tracing from Clean2**

That will:

* finally justify “Smooth into SVG first”
* make Clean2 clearly “better” than Clean1
* open the door to RDP + Chaikin immediately after

When you say the word, we will:

* keep Clean1 & Clean2 exactly as they are
* add a **third internal stage** (not necessarily a new canvas yet)
* emit the **first SVG preview**

No architectural rework needed.

You are exactly on the right track.
