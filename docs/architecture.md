# Architecture

**BeeMage — Extract the main outline**

This document describes the high-level architecture of **BeeMage — Extract the main outline**.

---

## Overview

BeeMage is a **Chrome Extension built on Manifest V3**.

Its architecture is intentionally simple:

* All image processing runs **locally in the browser**
* The user interface is implemented as a **panel-based extension UI**
* A minimal **background service worker** exists only to satisfy the MV3 lifecycle and shared infrastructure
* No external services, APIs, or remote code are used

There is **no backend** and **no network dependency**.

---

## High-Level Architecture

```
┌─────────────────────────────┐
│        Browser UI           │
│  (Extension Panel)          │
│                             │
│  ┌─────────────┐            │
│  │ image Tab │            │
│  │ Colors Tab  │            │
│  │ Settings    │            │
│  │ Logs        │            │
│  └─────────────┘            │
│                             │
│  Canvas-based processing    │
│  (client-side only)         │
└───────────────┬─────────────┘
                │
                │ message passing (internal only)
                ▼
┌─────────────────────────────┐
│ Background Service Worker   │
│ (Manifest V3)               │
│                             │
│ - Extension lifecycle       │
│ - Logging / diagnostics     │
│ - Platform abstraction      │
└─────────────────────────────┘
```

---

## Main Components

### `manifest.json`

* Declares extension metadata
* Defines the MV3 service worker
* Registers UI entry points
* Declares permissions (see below)

The manifest intentionally avoids optional or speculative permissions.

---

### Background (Service Worker)

The background script:

* Runs as a **Manifest V3 service worker**
* Does **not** perform image processing
* Does **not** access network resources
* Exists mainly for:

  * extension lifecycle management
  * internal message routing
  * shared logging and diagnostics

The service worker remains idle most of the time.

---

### UI Layer (Panel)

The primary user interface is a **panel-based UI**, composed of:

* **Mage tab**
  Image loading, image extraction, and output generation
* **Colors tab**
  Region-based coloring on top of the image output
* **Settings tab**
  Configuration and developer-oriented options
* **Logs tab**
  Audit and debug information

Each tab is implemented as a **self-contained module** with:

* its own view logic
* explicit DOM bindings
* no hidden cross-tab side effects

---

### Image Processing Layer

All image processing is:

* executed via the **HTML Canvas API**
* performed entirely in the UI context
* synchronous or microtask-based
* limited to in-memory image data

There is:

* no WebAssembly
* no OpenCV
* no GPU or WebGL dependency
* no background processing of images

---

### Assets

* Icons and static assets are bundled with the extension
* No assets are fetched at runtime
* No dynamic code loading is performed

---

## Permissions

BeeMage follows a **minimal-permissions** strategy.

### Declared permissions

* **`storage`**
  Used only for local configuration and preferences (if enabled)

No other permissions are required.

### Not used

BeeMage explicitly does **not** use:

* `host_permissions`
* network access
* file system access
* clipboard access
* tabs or browsing history access

---

## Libraries and Dependencies

BeeMage intentionally avoids external libraries.

* No frameworks (React, Vue, etc.)
* No image processing libraries
* No analytics or telemetry
* No remote scripts

The codebase relies exclusively on:

* TypeScript
* Standard Web APIs (Canvas, DOM)
* Chrome Extension APIs (minimal subset)

This keeps the extension:

* auditable
* portable
* easy to reason about

---

## Data Flow

* User loads an image → processed in-memory
* image output is stored only in UI state
* Colors tab reads output **explicitly** when requested
* No implicit state synchronization across tabs
* No persistent image storage unless the user downloads a file

---

## Security and Privacy Model

* All processing is local
* No data leaves the browser
* No background network requests
* No hidden communication channels

The extension can be fully inspected using standard Chrome developer tools.

---

## Architectural Goals

BeeMage is designed to remain:

* **Understandable** — small, explicit modules
* **Predictable** — no implicit automation
* **Extensible** — new tabs or processing steps can be added cleanly
* **Review-friendly** — suitable for Chrome Web Store review without friction

---
 