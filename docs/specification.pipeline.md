# Pipeline runner architecture and extension guide

This document explains the generic Pipeline tab end-to-end:

* where pipeline names come from (combo box)
* what gets built when you select a pipeline/recipe
* what gets executed when you run step-by-step (Next) or Run all
* how parameters are resolved (registry + presets + stored configs)
* how we finally arrive at the dispatcher (`runOp` → `runOpCore` → `opImpls`)
* what code changes are required to add a **new pipeline** and/or **new ops**

## Mental model

There are three distinct layers:

1. **Pipeline catalogue**: defines *what pipelines/stages/ops exist* (topology registry)
2. **Tuning registry + store**: defines *what parameters exist + defaults + engine policy* and stores user overrides (including presets)
3. **Dispatcher**: executes an op id using resolved params + selected engine (native/opencv) and calls the concrete implementation

The Pipeline tab combines (1) + (2) and executes via (3).

## Diagram: top-to-bottom flow

```mermaid
flowchart TD
  A[panel.ts boot] --> B[createTuningController]
  A --> C[createTabs(...)]

  C --> D[Pipeline tab mount/refresh]
  D --> E[createPipelineTab]
  E --> F[createPipelineModel]
  F --> G[createPipelineCatalogue]

  D --> H[createPipelineView render]
  H --> I[Combo box options = vm.pipelines]
  I --> G

  H --> J[User selects pipeline/recipe]
  J --> K[tab.ts handlers]
  K --> L[model.setActivePipeline / setActiveRecipe]
  L --> M[model.rebuildInstalled]
  M --> G

  K --> N[tuning.setParamValue('pipeline','mode'/'recipe')]
  N --> O[tuning store persisted overrides]

  H --> P[User clicks Next]
  P --> Q[tab.ts runNext]
  Q --> R[seed input from srcCanvas]
  Q --> S[model.runNext]

  S --> T[buildPlanFromInstalled]
  T --> G

  S --> U[getEffectiveParams(tuningId)]
  U --> V[tuning registry + stored overrides]
  V --> O

  S --> W[runOp(dispatchId,payload)]
  W --> X[opsDispatch.ts runOp]
  X --> Y[opsDispatchCore.ts runOpCore]
  Y --> Z[resolveComponent(opId, registry, stored, runtime)]
  Z --> V
  Y --> AA[choose engine, coerce params]
  Y --> AB[opImpls[opId][engine](...)]
  AB --> AC[segmentation/lib/* implementations]
```

## 0) Where the Pipeline tab is mounted

### `src/panel/panel.ts`

* creates the `tuning` controller
* mounts tuning UIs (including `pipelineTuningMountEl`)
* creates each tab (contour/segmentation/pipeline/…)
* registers the tab objects into `createTabs(dom, {...})`

The Pipeline tab lifecycle is driven by `createTabs`, not by the view.

### `src/panel/app/tabs.ts`

* `tabs.boot()` sets initial tab and calls that tab’s `mount()`
* tab switching calls:

  * `mount()` the first time the view is activated
  * `refresh()` on subsequent activations

So the first entry point is:

`createTabs.activate("pipeline")` → `pipelineTab.mount()`

## 1) Where the pipeline names in the combo box come from

### Source of truth: `src/panel/app/pipeline/catalogue.ts`

`createPipelineCatalogue()` defines:

* `pipelines: PipelineSpec[]` (segmentation, edge, clean, surface…)
* `ops: OpSpec[]` (the list of runnable ops, and whether they are dispatch/js)

### How it reaches the combo box

#### `src/panel/tabs/pipeline/model.ts`

`createPipelineModel()` owns a `catalogue = createPipelineCatalogue()` and `getVm()` returns:

* `vm.pipelines = catalogue.pipelines.map(...)`

#### `src/panel/tabs/pipeline/view.ts`

`render(vm)` calls `renderSelects(activePipelineId, activeRecipeId)` and renders `<option>` from **`vm.pipelines`**.

So:

* **data origin**: `app/pipeline/catalogue.ts`
* **VM assembly**: `tabs/pipeline/model.ts`
* **DOM rendering**: `tabs/pipeline/view.ts`

## 2) What happens when you select a pipeline

### UI event

`tabs/pipeline/view.ts` listens to `selectPipeline.change` and calls:

`handlers.onSelectPipeline(id)`

### Handler

`tabs/pipeline/tab.ts` implements `onSelectPipeline`:

1. `model.setActivePipeline(id)`
2. `render()`
3. persists selection: `tuning.setParamValue("pipeline","mode",id)`

### Model rebuilds the installed pipeline

`tabs/pipeline/model.ts`:

* `setActivePipeline(id)`:

  * sets `activePipelineId`
  * resets `activeRecipeId = "default"`
  * calls `reset()`

* `reset()`:

  * `rebuildInstalled()`
  * `resetRunState()`

* `rebuildInstalled()`:

  * reads `PipelineSpec` from `catalogue.getPipeline(activePipelineId)`
  * selects a recipe (`makeRecipesForPipeline(spec)`)
  * builds `InstalledPipeline` (stageId → list of op instances)

So the “configuration you see” (stages + ops list) is assembled from:

* `PipelineSpec` (stage titles, stage IO, allowedOps, defaultOps)
* `OpSpec` (op titles, op IO, dispatchId/tuningId)
* `InstalledPipeline` (actual op instances installed into each stage)

## 3) Where the stage configuration UI comes from

What appears under the stage cards is purely the **model VM**.

### Model builds StageVm

`tabs/pipeline/model.ts` → `getVm()`:

* maps installed stages into `StageVm[]`
* fills titles from `PipelineSpec.stages`
* fills op titles/IO from `catalogue.ops`
* state comes from `opState` / `stageState`

### View renders StageVm

`tabs/pipeline/view.ts` → `renderStages(vm)`:

* iterates `vm.stages`
* prints `input -> output` info
* (and if provided) draws preview canvases from outputs

Important constraint: the view only draws previews if the VM exposes them. If the model does not store per-step outputs into the VM, the view cannot invent them.

## 4) Execution chain: Next step (step-by-step) to dispatcher

### UI → tab

`tabs/pipeline/view.ts` click → `handlers.onNext()`

`tabs/pipeline/tab.ts`:

1. `seedInputOnceIfMissing()` (reads `srcCanvas`)
2. `await model.runNext()`
3. `render()`

### Model executes one op

`tabs/pipeline/model.ts` → `runNext()`:

1. validates pipeline is implemented and input exists
2. builds plan if needed: `buildPlanFromInstalled()`
3. seeds `currentArtifact` from input at first step
4. resolves params:

   * `params = await deps.runner.getEffectiveParams(step.tuningId)`
5. dispatch execution:

   * `runOp(step.dispatchId, payload)` for dispatch ops
6. enforces output type and updates:

   * `currentArtifact`
   * `lastOutput`
   * `opState`, `stageState`
   * `nextIndex`

### Dispatcher hop

`runOp` is imported from:

`src/panel/platform/opsDispatch.ts`

And that calls:

* `opsDispatchCore.ts` to resolve engine + params
* `opsDispatchImpl.ts` to run the actual implementation

So the final execution chain is:

`tabs/pipeline/model.ts` → `platform/opsDispatch.ts` → `platform/opsDispatchCore.ts` → `platform/opsDispatchImpl.ts`

## 5) Execution chain: Run all (universal runner)

Run all is the same destination but a different orchestration:

* view click → tab.ts `runAll()`
* `model.runAll()` calls:

  * `runInstalledPipeline({ catalogue, installed, inputImage, deps })`

`src/panel/app/pipeline/runner.ts` then:

* iterates stages and ops
* resolves params per op via `deps.getEffectiveParams(op.tuningId)`
* dispatches via `runOp(dispatchId, payload)` for dispatch ops

So:

`tabs/pipeline/model.ts` → `app/pipeline/runner.ts` → `platform/opsDispatch.ts` → `opsDispatchCore.ts` → `opsDispatchImpl.ts`

## 6) Where tuning registry and presets enter the chain

### Registry is used at runtime by the dispatcher

`src/panel/platform/opsDispatchCore.ts` imports and instantiates:

* `createComponentRegistry()` from `src/panel/app/tuning/registry.ts`

It also calls:

* `loadComponentConfigs()` from `src/panel/app/tuning/store.ts` (persisted overrides)

Then it merges:

* registry defaults + stored overrides + runtime availability (opencv injected or not)

via:

* `resolveComponent(opId, registry, stored, runtime)`

### Presets are UI data until applied

Presets are applied by the tuning controller, not by the pipeline runner directly.

From your `rg` output:

* segmentation preset listing + selection:

  * `src/panel/tabs/segmentation/view.ts` imports `segmentationPresets` and `getSegmentationPresetById`

* preset application:

  * `src/panel/app/tuning/controller.ts` implements `applyPreset(preset: TuningPreset)`

When applied, presets become stored overrides. Those overrides are later read by:

* `tuning.getEffectiveParams(...)` (UI / runner)
* `loadComponentConfigs()` (dispatcher runtime path)

## 7) Input initialization and reset behavior

### Segmentation tab (reference behavior)

`src/panel/tabs/segmentation/tab.ts`:

* builds a session by reading `dom.srcCanvasEl`
* on `reset()` it immediately re-seeds from source so preview is never blank

### Pipeline tab (current behavior)

`src/panel/tabs/pipeline/tab.ts`:

* seeds input from `srcCanvas` on:

  * `mount()` (once)
  * `refresh()` (if missing)
  * `Next` (if missing)
  * `Run all` (always refreshes input)

Practical impact:

* If `srcCanvas` is empty, pipeline cannot run and should show “No input image”.
* If you want pipeline to behave like segmentation (always showing the current source immediately), the pipeline tab must re-seed the input on reset/mount/refresh (and ensure the view renders an input preview, not only run results).

## 8) Adding a new pipeline: what changes in code

Adding a new pipeline usually means **two different kinds of work**:

1. Defining topology: stages + which ops run (catalogue)
2. Defining new operations: typing + tuning + implementations (dispatcher + registry + libs)

### Checklist: add a new pipeline using existing ops (no new ops)

If your new pipeline is only a different ordering/selection of existing ops:

1. `src/panel/app/pipeline/catalogue.ts`

   * add a new `PipelineSpec`
   * define stages, allowedOps, defaultOps

2. `src/panel/app/tuning/registry.ts`

   * usually no changes if you reuse existing tuning ids
   * optionally add a tuning subtree under `pipeline.*` to provide pipeline-wide parameters

3. (Optional) `src/panel/app/tuning/presets/pipelinePresets.ts`

   * add presets that set:

     * `pipeline.mode`
     * recipe selection
     * relevant step parameters

No dispatcher changes needed if no new op ids are introduced.

### Checklist: add a new pipeline that introduces new ops (new process)

If the pipeline introduces a new operation (a new `OpId`), you currently must update **four** areas:
 
1. **Pipeline catalogue**

   * `src/panel/app/pipeline/catalogue.ts`
   * add a new `OpSpec` for the op (with `dispatchId` and `tuningId`)
   * include it in some pipeline stage `allowedOps/defaultOps`

2. **Tuning registry**

   * `src/panel/app/tuning/registry.ts`
   * add a component node for the op’s `tuningId`
   * define param schema + defaults
   * define engine policy and implemented engines

3. **Dispatcher core typing and param coercion**

   * `src/panel/platform/opsDispatchCore.ts`
   * extend:

     * `OpId` union
     * `OpInputsByOp`, `OpOutputsByOp`, `OpParamsByOp`
   * add a new `if (op === "your.new.op") { ... }` block in `resolveEngineAndParams()` to coerce params from resolved values

   This is why the dispatcher is “universal-ish” but not fully universal: `opsDispatchCore.ts` is a closed, typed map and must be extended for each new op.

4. **Dispatcher implementations**

   * `src/panel/platform/opsDispatchImpl.ts`
   * add `opImpls["your.new.op"] = { native: ..., opencv: ... }`
   * your implementation will typically call a helper function in a `lib/` module

### Where new implementation code should live

For segmentation-related image ops you currently store helpers in:

`src/panel/tabs/segmentation/lib/`

* `color.ts`
* `denoise.ts`
* `morphology.ts`
* `resize.ts`
* `threshold.ts`

So if you add a new segmentation-like step (image→image or image→mask or mask→mask), the normal pattern is:

* add a new helper file in `src/panel/tabs/segmentation/lib/<newStep>.ts`
* import it in `opsDispatchImpl.ts`
* wire it into `opImpls[...]`

For non-segmentation pipelines, you can still follow the same convention:

* put the low-level algorithm in a `tabs/<domain>/lib/` folder
* keep `opsDispatchImpl.ts` as the central routing table

## 9) Worked example: add a “clean” pipeline using segmentation libs

Goal: create a new pipeline that does:

1. Threshold (image → mask)
2. Morphology cleanup (mask → mask)
3. Remove small components (mask → mask) using the contour morphology helper

### A) Catalogue: new pipeline spec

In `src/panel/app/pipeline/catalogue.ts` add a `PipelineSpec` roughly like:

* pipeline id: `clean`
* stages:

  * `clean.binarize` (image→mask) default op: `op.seg.threshold`
  * `clean.cleanup` (mask→mask) default ops: `op.seg.morphology`, `op.contour.clean.removeSmallComponents`

This uses existing ops, so no new op ids required.

### B) Ensure the ops exist as `OpSpec`

Your existing ops already exist in the dispatcher as:

* `segmentation.threshold`
* `segmentation.morphology`
* `contour.clean.removeSmallComponents`

So your `OpSpec` entries should point at those dispatch ids and tuning ids, for example:

* `dispatchId: "segmentation.threshold"`, `tuningId: "segmentation.threshold"`
* `dispatchId: "segmentation.morphology"`, `tuningId: "segmentation.morphology"`
* `dispatchId: "contour.clean.removeSmallComponents"`, `tuningId: "contour.clean.removeSmallComponents"`

### C) No dispatcher-core change needed

Because you reused existing op ids, you do not touch:

* `opsDispatchCore.ts` typing maps
* `opsDispatchImpl.ts` routing

### D) Implementation functions already exist

* Threshold helper: `src/panel/tabs/segmentation/lib/threshold.ts`
* Morphology helper: `src/panel/tabs/segmentation/lib/morphology.ts`
* Remove-small-components helper: `src/panel/tabs/contour/lib/morphology` (already used in `opsDispatchImpl.ts`)

So the pipeline works with existing code.

## 10) What to tell a user of the Pipeline tab

* The combo box list is defined by the pipeline catalogue (`app/pipeline/catalogue.ts`).
* Selecting a pipeline rebuilds an installed pipeline (stages + specific ops per stage) in the model.
* Running step-by-step executes one op at a time through the dispatcher, resolving parameters from tuning:

  * defaults come from the tuning registry (`app/tuning/registry.ts`)
  * overrides come from stored tuning config (including presets)
* The visuals (input/output canvases) are purely what the model exposes and the view draws; if you want “see the image after each step”, the model must store each step output and the view must render it.

## 11) Known sharp edge: dispatcher “universality”

Right now, adding a new op is not only “add an OpSpec”:

* you must also extend `opsDispatchCore.ts` because it hardcodes:

  * the set of allowed op ids
  * typing for inputs/outputs/params
  * param coercion defaults per op

This is deliberate for strict typing, but it means every new op is a multi-file change.

---
 ##########################

Below are three structured “impact maps” you can paste into your markdown. They focus on **where code changes happen** (file + function/object) for each kind of extension.

## 1) Add a new artifact type (a new format flowing between stages)

### Impact map (what must change)

| Area                                            | File                                    | Function / object                                                                                     | What changes                                                                                                                    | Typical failure if missed                                                    |                                                                              |
| ----------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Core pipeline types                             | `src/panel/app/pipeline/type.ts`        | `ArtifactType`, `Artifact` union (+ new `XArtifact` type)                                             | Add `"newtype"` to `ArtifactType`, define `NewArtifact`, extend `Artifact = ...                                                 | NewArtifact`                                                                 | TS errors: missing type narrowing, `Property ... does not exist on type ...` |
| Runner execution                                | `src/panel/app/pipeline/runner.ts`      | `execDispatchOp()`, `execOp()`, `isImage/isMask` guards, new `isNewType()` guard, `makeNewArtifact()` | Teach the runner how to pass the new artifact into dispatch/js ops and how to wrap dispatch results into the correct `Artifact` | Runtime: “IO mismatch expected X got Y” or “Invalid op spec … not supported” |                                                                              |
| Model step-run (Next)                           | `src/panel/tabs/pipeline/model.ts`      | `runNext()` dispatch branch + VM mapping in `getVm()`                                                 | Add branch to build `out = { type:"newtype", ... }` and map `lastOutput` into `vm.outputNewType` (optional)                     | TS errors / runtime: output never shown, or crashes on artifact access       |                                                                              |
| View rendering (preview + download)             | `src/panel/tabs/pipeline/view.ts`       | `renderArtifactPreview()`, `drawCurrent()`, `downloadCurrentOutput()`                                 | Add type guard + preview strategy (canvas/img/text) + download strategy (Blob, PNG, etc.)                                       | Output blank, wrong element used, download disabled or wrong format          |                                                                              |
| Pipeline catalogue IO contracts                 | `src/panel/app/pipeline/catalogue.ts`   | `ops` definitions (`OpSpec.io`) and stage specs (`StageSpec.io`)                                      | Allow stages/ops to declare the new type in `io.input` / `io.output`                                                            | Runner validation fails: “IO mismatch …”                                     |                                                                              |
| Any dispatch typing (if new type is dispatched) | `src/panel/platform/opsDispatchCore.ts` | `OpInputsByOp`, `OpOutputsByOp` types                                                                 | If the dispatcher needs to carry this artifact, add the right input/output typings                                              | TS errors: impl signatures not assignable                                    |                                                                              |

### Notes (recommended pattern)

* Add the artifact type first (`type.ts`), then teach **runner + model + view** to handle it.
* Decide whether the new artifact is **dispatcher-visible** (goes through `opsDispatch`) or **JS-only** (only through `JsOpSpec.run`).

---

## 2) Add a new process (an “op”)

### Impact map (what must change)

| Area                                 | File                                                     | Function / object                                             | What changes                                                                                  | Typical failure if missed                                                        |
| ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Dispatch op typing                   | `src/panel/platform/opsDispatchCore.ts`                  | `OpId` union, `OpInputsByOp`, `OpOutputsByOp`, `OpParamsByOp` | Add `"your.op.id"` and define its input/output/params types                                   | TS: op not assignable, missing keys in `OpImpls`, params type mismatch           |
| Dispatch implementations (extension) | `src/panel/platform/opsDispatchImpl.ts`                  | `export const opImpls: OpImpls`                               | Add the new key with `native` + `opencv` implementation (even if opencv falls back to native) | Build error: “Property 'your.op.id' is missing … but required in type 'OpImpls'” |
| Dispatch implementations (demo)      | `demo/src/mocks/engine/opsDispatchImpl.ts`               | `export const opImpls: OpImpls`                               | Same as extension, but demo variant (can call same native function)                           | Demo build fails (tsc)                                                           |
| Engine param resolution              | `src/panel/platform/opsDispatchCore.ts`                  | `resolveEngineAndParams(op)`                                  | Add a case that returns typed params with defaults for the new op                             | Runtime: “Unknown op” or wrong defaults; TS may force a new branch               |
| Pipeline catalogue op card           | `src/panel/app/pipeline/catalogue.ts`                    | `ops: ReadonlyArray<OpSpec>`                                  | Add an `OpSpec` (usually `DispatchOpSpec`) with `io`, `dispatchId`, `tuningId`                | Op not available in UI / not installable                                         |
| Tuning registry (if op is tunable)   | `src/panel/app/tuning/registry.ts` (and presets if used) | Node definition for the op’s `tuningId`                       | Add params schema + defaults + engine policy as needed                                        | Params never change / missing UI controls                                        |
| Implementation library code          | Usually in `src/panel/tabs/pipeline/lib/...`             | Function you call from opImpls                                | Add the actual algorithm / transformer                                                        | Op exists but does nothing useful                                                |

### Notes (recommended pattern)

* **Dispatch op** = lives in `opsDispatchCore.ts` + both impl files.
* **JS op** (no dispatch) = skip `opsDispatchCore.ts` and `opsDispatchImpl.ts`; only add in `catalogue.ts` as `kind:"js"` and implement `run()`.

---

## 3) Add a new pipeline

### Impact map (what must change)

| Area                                 | File                                  | Function / object                                       | What changes                                                                             | Typical failure if missed                                 |
| ------------------------------------ | ------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Pipeline spec (stages + allowed ops) | `src/panel/app/pipeline/catalogue.ts` | `pipelines: ReadonlyArray<PipelineSpec>`                | Add a `PipelineSpec` with ordered stages, each with `io`, `allowedOps`, and `defaultOps` | Pipeline not selectable / runner refuses execution        |
| Ops required by the pipeline         | `src/panel/app/pipeline/catalogue.ts` | `ops: ReadonlyArray<OpSpec>`                            | Ensure every `opId` used by `allowedOps/defaultOps` exists in catalogue ops list         | Runner validation: “Unknown opId …” or “Op not allowed …” |
| Runner support for pipeline IO       | `src/panel/app/pipeline/runner.ts`    | `validateChainIO()`, `execDispatchOp()`                 | Usually none unless pipeline introduces new IO combos (e.g. mask→svg, image→svg, svg→…)  | Run all fails at runtime with “not supported here”        |
| Model recipes (optional)             | `src/panel/tabs/pipeline/model.ts`    | `makeRecipesForPipeline(spec)`                          | Add recipe presets if you want “fast/strong/…” variants for this pipeline                | Only “Default” appears                                    |
| Tuning “pipeline selection”          | `src/panel/app/tuning/registry.ts`    | The node that holds `pipeline.mode` / `pipeline.recipe` | Add the pipeline id as a selectable mode (if the UI uses tuning-driven selection)        | Pipeline exists but cannot be selected / selection resets |
| Pipeline tuning subtree (optional)   | `src/panel/app/tuning/registry.ts`    | Root node for `scopeRootId = <pipelineId>`              | Create tuning nodes for ops used by the pipeline (or rely on existing ones)              | No tuning panel for that pipeline                         |
| View (usually none)                  | `src/panel/tabs/pipeline/view.ts`     | Select rendering                                        | Usually no change; it renders whatever pipelines the model exposes                       | N/A                                                       |

### Notes (recommended pattern)

* Pipeline creation is mostly **catalogue + (optional) tuning + (optional) recipes**.
* The runner is generic, but it must support the IO patterns you introduce (e.g. mask→svg required code changes earlier).

---
 