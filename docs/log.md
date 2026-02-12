# Logging, Tracing, and History

This document defines the **logging and tracing architecture** used by
**BeeMage — Explore image processing through visual pipelines**.

It is intended as:

* a reference for contributors
* a sanity check during code reviews
* a rule set to prevent logging misuse

---

## Overview

The project uses **three distinct logging channels**.

Each channel has a **single responsibility** and must **never be mixed** with another, except where explicitly stated.

---

## Logging & Tracing Architecture

| Type                    | Audience  | Persistence | Controlled by       | Functions / Location                                                                                                   | What it is for                                                                                                                | What it must NOT be used for            |
| ----------------------- | --------- | ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Console Log / Trace** | Developer | ❌ No<br>❌ No<br>❌ No<br>❌ No<br>✅ Yes<br><br><br>        | `traceConsole` flag | `logTrace()`<br>`logInfo()`<br>`logWarn()`<br>`logError()`<br>`traceScope()`<br>**File:** `src/background/util/log.ts` | Development-time flow, parameters, diagnostics. `traceScope` can optionally mirror diagnostics into Debug Trace when enabled. | User history, auditing, business events |
| **Debug Trace**         | Developer | ✅ Yes       | Debug trace toggle  | `debugTrace.append()`<br>`debugTrace.isEnabled()`<br>**File:** `src/shared/debugTrace.ts`                              | Deep inspection, exportable diagnostics, structured traces                                                                    | User-visible actions, business events   |
| **Action / Audit Log**  | User      | ✅ Yes       | Feature logic       | `actionLog.append()`<br>`actionLog.list()`<br>`actionLog.clear()`<br>**File:** `src/shared/actionLog.ts`               | What the extension did, completed actions, visible errors                                                                     | Console debugging, internal dev notes   |

---

## One-sentence rule for each

* **Console logging (`log*`, `traceScope`)** → *“Help me while coding; optionally persist diagnostics if Debug is enabled.”*
* **Debug trace (`debugTrace`)** → *“Let me inspect what really happened.”*
* **Action log (`actionLog`)** → *“Tell the user what the extension did.”*

---

## Layer responsibilities (important)

### API layer

* Example: `loadImageApi`
* No logging
* No Chrome API calls
* Returns structured results only

---

### Executor layer

* Orchestrates execution phases
* Sends progress and completion signals
* Uses:

  * `logTrace`, `logWarn`, `logError`, `traceScope` (developer diagnostics)
  * `actionLog.append` (completed actions only)

---

### Index / entry layer

* Calls executors
* No HTTP details
* No API parsing
* No business logic logging

---

## The three logging channels (formal definition)

### 1) Console diagnostics (developer-facing, volatile)

* Purpose: development-time diagnostics
* Visibility: DevTools console only
* Controlled by: `traceConsole` flag
* Persistence: none (lost on reload)

Used for:

* execution flow
* temporary debugging
* development noise

---

### 2) Debug trace (developer-facing, persisted)

* Purpose: deep inspection and exportable diagnostics
* Visibility: Logs tab → **Debug trace**
* Controlled by: Debug enabled toggle
* Persistence: `chrome.storage` (JSON)

Used for:

* diagnostics that may be exported
* summaries of internal state
* payload / structure previews
* diagnostics emitted via `traceScope`

Notes:

* `debugTrace.append()` is a **no-op when Debug is disabled**
* Turning Debug OFF wipes all stored debug traces

Direct calls to `debugTrace.append()` are allowed, but should be **rare** and reserved for explicit, high-value diagnostic boundaries.

---

### 3) Action / audit log (user-facing, persisted)

* Purpose: user-visible history
* Visibility: Logs tab → **Audit log**
* Controlled by: feature logic
* Persistence: `chrome.storage`

Used for:

* completed operations
* user-visible success / failure
* irreversible actions

This is **not debugging**.
It is **history**.

---

## Canonical naming (decision)

### A) Console logging (`traceConsole`)

**File:** `src/background/util/log.ts`

| Function     | Behavior                                 |
| ------------ | ---------------------------------------- |
| `logTrace()` | Logged only if `traceConsole` is enabled |
| `logInfo()`  | Logged only if `traceConsole` is enabled |
| `logWarn()`  | Always logged                            |
| `logError()` | Always logged                            |

These functions **never write to storage**.

Mental model:

> `log*` = console only

---

### A.1) Trace bridge helper (`traceScope`)

**File:** `src/background/util/log.ts`

`traceScope(message, meta?)` is a **convenience helper** that combines:

* console trace behavior (same as `logTrace`)
* optional persistence into **Debug Trace** when Debug is enabled

Behavior:

* Console output → only if `traceConsole` is enabled
* Debug trace storage → only if Debug enabled is ON
* No persistence when Debug is OFF

Rules:

* Use `traceScope` for diagnostics you may want to export
* Keep `meta` small (counts, flags, summaries)
* Never pass large buffers or raw image data
* Never use for user-visible actions

Mental model:

> `traceScope` = trace now, persist only if requested

---

### B) Debug trace (persisted, developer-only)

**File:** `src/shared/debugTrace.ts`

* JSON-based
* Exportable
* Toggle-controlled
* Developer-facing only

---

### C) Action log (persisted, user history)

**File:** `src/shared/actionLog.ts`

* User-visible
* Business events only
* Never used for debugging

---

## What must NOT be done anymore

* ❌ Do not expect console logs to appear in the Logs tab
* ❌ Do not use `debugTrace` for user actions
* ❌ Do not use console logging for business logic
* ❌ Do not introduce new ad-hoc logging helpers
  *(exception: the canonical `traceScope` helper)*

---

## Enforced naming rules

The following names are **deprecated and banned**:

```ts
trace()
traceWarn()
traceError()
```

They are ambiguous and must not be used.

---

## Correct usage example

```ts
traceScope("PROCESS start", { width, height });

const result = await processImage(...);

if (result.ok) {
  actionLog.append({
    kind: "info",
    scope: "image",
    message: "Image processed successfully",
    ok: true
  });
} else {
  actionLog.append({
    kind: "error",
    scope: "image",
    message: "Image processing failed",
    ok: false,
    error: result.error
  });
}
```

Console ≠ Debug trace ≠ Audit log.

---

## Bottom line

The architecture is simple and intentional:

* **Console logs** are for developers while coding
* **Debug trace** is for exportable diagnostics
* **Action log** is for user-visible history
* **`traceScope`** bridges console trace and debug trace *only when explicitly enabled*

If these rules are followed, logging stays readable, useful, and maintainable.
