# Demo Overview

Alongside **BeeMage — Explore image processing through visual pipelines**, this project provides a **Demo version**.

The demo exists for **preview, documentation, and presentation purposes**.

---

## Demo version

### What it is — and what it is NOT

### What the demo **is**

* A **web-based version** of the BeeMage panel UI
* Runs the **same UI and processing code** as the extension
* Processes **real images locally in the browser**
* Uses **the same pipeline definitions and execution logic**
* Adapts to a web environment via **platform seam swapping**
* Requires:

  * no account
  * no login
  * no browser extension installation

The demo is intended for:

* previewing the user interface
* understanding the workflow
* documentation and screenshots
* embedding in websites (e.g. WordPress)
* public presentation and review

### What the demo **is NOT**

* ❌ Not a Chrome extension
* ❌ Not installed via `chrome://extensions`
* ❌ No access to browser APIs restricted to extensions
* ❌ No access to user browsing data
* ❌ No background or privileged extension context

---

## How the demo works (important)

The demo is **not a mock UI**.

It runs the **real BeeMage panel code**, but replaces certain platform-dependent components with web-compatible implementations:

* storage → browser-local mock storage
* runtime APIs → web-safe runtime wrapper
* engine adapter → demo-compatible engine detection
* OpenCV execution → demo-only OpenCV dispatch implementation

This ensures:

* identical UI behavior
* identical pipeline logic
* safe execution outside an extension context

---

## How to access the demo

The demo is distributed **separately** from the extension.

It is typically available in two forms:

### 1) Live demo (recommended)

* Hosted via **GitHub Pages**
* Accessible from the project homepage
* Can be embedded in other websites
* No installation required

### 2) Demo ZIP archive

* Provided as a **separate ZIP** in GitHub Releases
* Versioned consistently with the extension
* Can be:

  * opened locally
  * hosted on any static web server
  * embedded via iframe

The demo ZIP is **not installed** as an extension.

---

## Relationship between extension and demo

| Component         | Purpose                              |
| ----------------- | ------------------------------------ |
| Extension package | Real usage inside the browser        |
| Demo package      | Preview, documentation, presentation |

If you want to **use BeeMage** → install the **extension**.
If you want to **see how it works** → open the **demo**.

---

## Demo delivery and publishing

The demo is built from the same source code as the extension.

During the release process:

* the extension is built and packaged
* the demo is built as a static web application
* ZIP archives are created for both
* the demo output is copied into the repository’s GitHub Pages directory
* a GitHub Release is created containing both artifacts

As a result:

* the **extension ZIP** is available in GitHub Release assets
* the **demo ZIP** is available in GitHub Release assets
* the **live demo** is accessible via GitHub Pages

---

## Privacy and data

The demo:

* runs entirely in the browser
* does not upload images
* does not collect data
* does not use analytics
* does not require authentication

Images and processing results exist only in memory unless the user downloads them.

For real usage details, refer to the extension documentation and privacy policy.

---

## Summary

| Artifact      | Purpose                          |
| ------------- | -------------------------------- |
| Extension ZIP | Real usage (Chrome Extension)    |
| Demo ZIP      | Offline / custom hosting         |
| Live demo     | Public preview and documentation |

This separation ensures a clear distinction between **using BeeMage** and **previewing how it works**.

---

 