# Logging, Tracing, and History

This document defines the **logging and tracing architecture** used by  
**BeeContour — Extract the main outline**.

It is intended as:

- a reference for contributors
- a sanity check during code reviews
- a rule set to prevent logging misuse

---

## Overview

The project uses **three distinct logging channels**.

Each channel has a **single responsibility** and must **never be mixed** with another.

---

## Logging & Tracing Architecture

| Type                     | Audience           | Persistence | Controlled by        | Functions / Location                              | What it is for                                                                 | What it must NOT be used for                         |
|--------------------------|--------------------|-------------|----------------------|---------------------------------------------------|---------------------------------------------------------------------------------|------------------------------------------------------|
| **Console Log / Trace**  | Developer          | ❌ No       | `traceConsole` flag  | `logTrace()`<br>`logInfo()`<br>`logWarn()`<br>`logError()`<br>**File:** `src/background/util/log.ts` | Execution flow, parameters, dev diagnostics                                                | User history, auditing, persisted debugging          |
| **Debug Trace**          | Developer (deep)   | ✅ Yes      | Debug trace toggle   | `debugTrace.append()`<br>`debugTrace.isEnabled()`<br>**File:** `src/shared/debugTrace.ts`          | HTTP inspection, payload structure, first-item previews, exportable diagnostics | User-visible actions, business events                |
| **Action / Audit Log**   | User               | ✅ Yes      | Feature logic        | `actionLog.append()`<br>`actionLog.list()`<br>`actionLog.clear()`<br>**File:** `src/shared/actionLog.ts` | What the extension did, completed actions, visible errors                              | Console debugging, internal dev notes                |

---

## One-sentence rule for each

- **Console logging (`log*`)** → *“Help me while coding.”*
- **Debug trace (`debugTrace`)** → *“Let me inspect what really happened.”*
- **Action log (`actionLog`)** → *“Tell the user what the extension did.”*

---

## Layer responsibilities (important)

### API layer

- Example: `createProjectApi`
- No logging
- No Chrome API calls
- Returns structured results only

### Executor layer

- Orchestrates execution phases
- Sends progress and completion signals
- Uses:
  - `logTrace`, `logWarn`, `logError` (console)
  - `actionLog.append` (for completed actions)

### Index / entry layer

- Calls executors
- No HTTP details
- No API parsing
- No business logic logging

---

## The three logging channels (formal definition)

### 1) Console diagnostics (developer-facing, volatile)

- Purpose: development-time diagnostics
- Visibility: DevTools console only
- Controlled by: `traceConsole` flag
- Persistence: none (lost on reload)

---

### 2) Debug trace (developer-facing, persisted)

- Purpose: deep inspection and exportable diagnostics
- Visibility: Logs tab → Debug trace
- Controlled by: debug trace toggle
- Persistence: `chrome.storage` (JSON)

Use this for:

- HTTP calls and endpoints
- payload and response structure
- previewing fetched data

**Never use this for user-visible actions.**

Example:

```ts
await debugTrace.append([
  {
    scope: "background",
    kind: "debug",
    message: "HTTP POST /example/endpoint",
    meta: { /* payload preview */ }
  }
]);
````

---

### 3) Action / audit log (user-facing, persisted)

* Purpose: user-visible history
* Visibility: Logs tab (actions)
* Controlled by: feature logic
* Persistence: `chrome.storage`

Use this for:

* create / delete / move actions
* completed operations
* user-visible errors

This is **not debugging**.
It is **history**.

Example:

```ts
actionLog.append({
  kind: "info",
  scope: "projects",
  message: "Created project",
  ok: true
});
```

---

## Canonical naming (decision)

### A) Console logging (`traceConsole`)

**File:** `src/background/util/log.ts`

| Function     | Behavior               |
| ------------ | ---------------------- |
| `logTrace()` | Logged only if enabled |
| `logInfo()`  | Logged only if enabled |
| `logWarn()`  | Always logged          |
| `logError()` | Always logged          |

**These functions never write to storage.**

Mental model:

> `log*` = console only

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

### Example: Create action

```ts
logTrace("CREATE start", { name });

const result = await executeCreate(...);

if (result.ok) {
  actionLog.append({
    kind: "info",
    scope: "projects",
    message: `Created "${result.title}"`,
    ok: true
  });
} else {
  actionLog.append({
    kind: "error",
    scope: "projects",
    message: "Create failed",
    ok: false,
    error: result.error
  });
}
```

Console ≠ debug trace ≠ audit log.

---

## Bottom line

The architecture is simple and intentional.

* **Console logs** are for developers
* **Debug trace** is for deep inspection
* **Action log** is for users

If these rules are followed, logging stays readable, useful, and maintainable.

 