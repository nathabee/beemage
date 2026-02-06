# Pipeline runner architecture and extension guide

This document describes the generic **Pipeline** tab end-to-end:

- where pipeline names (combo box) come from
- what is built when you select a pipeline + recipe
- what runs when you execute **Next** (step-by-step) vs **Run all**
- how parameters are resolved (registry defaults + presets + stored overrides)
- how execution reaches the dispatcher (`runOp → runOpCore → opImpls`)
- what code changes are required to add a **new artifact type**, **new op**, or **new pipeline**

## Mental model

There are three layers:

1. **Pipeline catalogue**: what pipelines/stages/ops exist (topology + contracts)
2. **Tuning registry + store**: what parameters exist + defaults + engine policy + persisted overrides (presets become overrides)
3. **Dispatcher**: executes an op id using resolved params + chosen engine (native/opencv)

The Pipeline tab composes (1) + (2) and executes via (3).

## Top-to-bottom flow (diagram)

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
  AB --> AC[domain lib implementations]
````

## 0) Where the Pipeline tab is mounted

### `src/panel/panel.ts`

* creates the tuning controller
* mounts tuning UIs (including `pipelineTuningMountEl`)
* creates the tabs (mage/segmentation/pipeline/…)
* registers tab objects into `createTabs(dom, {...})`

The Pipeline tab lifecycle is driven by `createTabs`, not by the view.

### `src/panel/app/tabs.ts`

* `tabs.boot()` picks the initial tab and calls that tab’s `mount()`
* switching calls:

  * `mount()` the first time the tab is activated
  * `refresh()` on subsequent activations

Entry point:

`createTabs.activate("pipeline") → pipelineTab.mount()`

## 1) Where pipeline names in the combo box come from

### Source of truth: `src/panel/app/pipeline/catalogue.ts`

`createPipelineCatalogue()` defines:

* `pipelines: PipelineSpec[]`
* `ops: OpSpec[]` (dispatch or js ops)

### How it reaches the combo box

* `src/panel/tabs/pipeline/model.ts`
  `getVm()` returns `vm.pipelines = catalogue.pipelines.map(...)`

* `src/panel/tabs/pipeline/view.ts`
  `render(vm)` renders `<option>` from `vm.pipelines`

So:

* data origin: `app/pipeline/catalogue.ts`
* VM assembly: `tabs/pipeline/model.ts`
* DOM rendering: `tabs/pipeline/view.ts`

## 2) What happens when you select a pipeline or recipe

### UI event

`view.ts` listens to select changes and calls handlers:

* `handlers.onSelectPipeline(id)`
* `handlers.onSelectRecipe(id)`

### Handler

`tabs/pipeline/tab.ts`:

* updates model: `model.setActivePipeline(id)` / `model.setActiveRecipe(id)`
* persists selection: `tuning.setParamValue("pipeline","mode"/"recipe", id)`
* remounts tuning subtree for the selected pipeline
* renders

### Model rebuild

`tabs/pipeline/model.ts`:

* `setActivePipeline()` resets recipe to `"default"` then calls `reset()`
* `reset()` does:

  * `rebuildInstalled()` (build InstalledPipeline for selected pipeline/recipe)
  * `resetRunState()` (clears execution state and caches)

InstalledPipeline is assembled from:

* `PipelineSpec` (stages: titles, IO contracts, allowedOps, defaultOps)
* `OpSpec` (op titles, IO, dispatchId/run, tuningId)
* recipe builder (decides which op instances are installed per stage)

## 3) Where stage cards and previews come from

Everything under “Stages” is driven by the model VM:

* `model.getVm()` builds `StageVm[]` from the installed config
* stage/op titles and IO come from `PipelineSpec` + `OpSpec`
* state comes from execution caches (`opState` / `stageState`)
* previews render only if the model supplies output artifacts

Constraint: the view cannot invent intermediate outputs; it only renders what the VM contains.

## 4) Execution: Next step (step-by-step)

### UI → tab

`Next` click → `tab.ts runNext()`:

1. seed input from `dom.srcCanvasEl` if missing
2. `await model.runNext()`
3. render

### Model execution

`model.runNext()`:

1. validates pipeline is implemented and input exists
2. builds an op plan from the installed pipeline (if needed)
3. seeds `currentArtifact` from input for the first step
4. resolves params (when op has a `tuningId`):

   * `params = await deps.runner.getEffectiveParams(tuningId)`
5. executes:

   * dispatch op: `runOp(dispatchId, payload)`
   * js op: `opSpec.run({ input, params })`
6. enforces declared output type and updates caches:

   * `currentArtifact`, `lastOutput`
   * `opState`, `stageState`
   * `nextIndex`

Dispatcher hop:

`model.runNext → platform/opsDispatch.ts → opsDispatchCore.ts → opsDispatchImpl.ts`

## 5) Execution: Run all (runner)

Run all uses the same dispatcher but different orchestration:

* `view click → tab.ts runAll()`
* `model.runAll()` calls `runInstalledPipeline({ catalogue, installed, inputImage, deps })`

`src/panel/app/pipeline/runner.ts`:

* validates stage/op legality and IO chain
* iterates stages and their op chains
* executes each op via dispatch or js
* returns `PipelineRunResult` with per-stage/per-op results and final output artifact

Execution chain:

`model.runAll → app/pipeline/runner.ts → platform/opsDispatch.ts → opsDispatchCore.ts → opsDispatchImpl.ts`

## 6) How tuning registry and presets enter the chain

### Runtime param resolution is dispatcher-driven

`opsDispatchCore.ts`:

* instantiates the tuning registry (`createComponentRegistry()` from `app/tuning/registry.ts`)
* loads persisted overrides (`loadComponentConfigs()` from `app/tuning/store.ts`)
* merges defaults + overrides + runtime availability through `resolveComponent(...)`
* chooses engine and coerces params before calling `opImpls`

### Presets are UI-level until applied

Presets are applied by the tuning controller. When applied, they become stored overrides, which then affect:

* `tuning.getEffectiveParams(...)` (used by model/runner)
* `loadComponentConfigs()` (used by dispatcher runtime resolution)

## 7) Input initialization and reset behavior

Pipeline tab input comes from `dom.srcCanvasEl`:

* `mount()` / `refresh()` re-seed the input
* `Next` seeds input if missing
* `Run all` refreshes input before running
* `Reset` should typically reseed from source to avoid blank previews

If `srcCanvas` is empty, the pipeline should show “No input image”.

## 8) Extension impact maps

### 8.1 Add a new artifact type (a new format flowing between ops)

| Area                               | File                                    | Function / object                                               | What changes                                                                                 |
| ---------------------------------- | --------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Core types                         | `src/panel/app/pipeline/type.ts`        | `ArtifactType`, `Artifact` union (+ new `XArtifact`)            | Add union member, define artifact shape, update helpers like `artifactDims(...)`             |
| Runner orchestration               | `src/panel/app/pipeline/runner.ts`      | `execDispatchOp`, `execOp`, runtime IO checks                   | Teach runner how to execute and wrap the new artifact type; extend supported IO combinations |
| Step-by-step orchestration         | `src/panel/tabs/pipeline/model.ts`      | `runNext`, `getVm`                                              | Build the new artifact in `runNext` and map `lastOutput` into VM fields as needed            |
| UI rendering + download            | `src/panel/tabs/pipeline/view.ts`       | `renderArtifactPreview`, `drawCurrent`, `downloadCurrentOutput` | Add guard + preview strategy + download strategy                                             |
| Dispatcher typing (only if needed) | `src/panel/platform/opsDispatchCore.ts` | input/output maps                                               | Extend types if the dispatcher must accept/produce this artifact                             |

### 8.2 Add a new process (an op)

| Area              | File                                                  | Function / object                       | What changes                                                          |
| ----------------- | ----------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Op spec list      | `src/panel/app/pipeline/catalogue.ts`                 | `ops: OpSpec[]`                         | Add `OpSpec` with `id`, `title`, `io`, and `dispatchId` or `run()`    |
| Stage wiring      | `src/panel/app/pipeline/catalogue.ts`                 | `StageSpec.allowedOps/defaultOps`       | Allow the op in relevant stages and optionally include it in defaults |
| Dispatcher typing | `src/panel/platform/opsDispatchCore.ts`               | `OpId` union + input/output/params maps | Extend the closed typed maps and param coercion rules                 |
| Implementations   | `src/panel/platform/opsDispatchImpl.ts` (+ demo impl) | `opImpls[...]`                          | Register native/opencv (or native-only) implementation                |
| Tuning (optional) | `src/panel/app/tuning/registry.ts`                    | node for `tuningId`                     | Add schema + defaults + engine policy; optionally add presets         |

### 8.3 Add a new pipeline

| Area                          | File                                  | Function / object                  | What changes                                                                         |
| ----------------------------- | ------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| Pipeline specs                | `src/panel/app/pipeline/catalogue.ts` | `pipelines: PipelineSpec[]`        | Add `PipelineSpec` with ordered stages, IO, allowedOps, defaultOps, implemented flag |
| Default installed config      | `src/panel/app/pipeline/catalogue.ts` | `makeDefaultInstalled(pipelineId)` | Ensure the pipeline can build a valid InstalledPipeline                              |
| Model recipes (optional)      | `src/panel/tabs/pipeline/model.ts`    | `makeRecipesForPipeline(spec)`     | Add recipe variants (fast/strong/…)                                                  |
| Tuning mount scope (optional) | `src/panel/app/tuning/registry.ts`    | scope root nodes                   | Add a root matching `pipelineId` (or `pipeline.<id>`) so tuning can mount cleanly    |

## 9) Known sharp edge: dispatcher “universality”

Adding a new dispatch op is not only “add an OpSpec”:

* `opsDispatchCore.ts` is a closed, typed map:

  * allowed op ids
  * input/output/params typing
  * param coercion and defaults

This is intentional for strict typing, but it makes each new dispatch op a multi-file change.

``` 