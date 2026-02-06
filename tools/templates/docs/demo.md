# Demo Overview

Alongside **BeeMage — Extract the main outline**, this project provides a **Demo version**.

The demo is intended for preview, documentation, and presentation purposes only.

---

## Demo version  
### What it is — and what it is NOT

### What the demo **is**

- A **web-based simulation** of the extension UI
- Runs the **real UI code** in a normal browser page
- Uses **mock data only**
- Requires:
  - no account
  - no login
  - no browser extension installation

The demo is designed for:

- previewing the user interface
- testing interaction flows
- documentation and screenshots
- embedding in websites (for example WordPress)
- public presentation and review

### What the demo **is NOT**

- ❌ Not a browser extension
- ❌ Not connected to any user account
- ❌ No access to real browser data
- ❌ No access to external services
- ❌ Not installable via `chrome://extensions`

---

## How to access the demo

The demo is distributed **separately** from the extension.

It is typically provided as a ZIP file in the same GitHub Release as the extension:

- `beemage-demo-0.0.1.zip`

The demo ZIP is **not** installed as an extension.

Instead, it can be:

- served as a **static website**
- opened locally in a browser
- embedded in another website (for example via an iframe)
- hosted on GitHub Pages or any static hosting service

---

## Relationship between extension and demo

| Component        | Purpose                                      |
| ---------------- | -------------------------------------------- |
| Extension package | Real usage inside the browser                |
| Demo package      | UI preview and documentation                 |

If you want to **use BeeMage — Extract the main outline** → install the **extension**.  
If you want to **see how it works** → open the **demo**.

---


## Demo delivery and publishing

The demo is delivered **inside the repository** under:

```

/docs/demo

```

This has two important consequences:

### GitHub Pages publication

If the GitHub repository is configured to publish **GitHub Pages from `/docs`**, then:

- the demo is automatically published as part of the GitHub Pages site
- the demo becomes accessible via the project homepage

This allows the demo to be:

- publicly accessible
- linked from documentation
- embedded in other websites
- used for screenshots and previews without installing the extension

---

## Build and release workflow

The demo is built and published together with the extension as part of the release process.

The script:

```

scripts/release-all.sh

```

is responsible for:

- building the extension
- building the demo
- creating ZIP archives for:
  - the extension
  - the demo
- copying the demo’s static output into:
```

/docs/demo

```
- committing the updated documentation and demo
- creating a GitHub Release

As a result:

- the **extension ZIP** is available in the GitHub Release assets
- the **demo ZIP** is available in the GitHub Release assets
- the **live demo** is available via GitHub Pages

---

## Summary

| Artifact        | Location                          | Purpose                         |
|-----------------|-----------------------------------|---------------------------------|
| Extension ZIP   | GitHub Release assets             | Real usage                       |
| Demo ZIP        | GitHub Release assets             | Offline / custom hosting         |
| Live demo       | GitHub Pages (`/docs/demo`)       | Public preview and documentation |

This separation ensures that users can clearly distinguish between **using the extension** and **previewing its interface**.
 
---

## Privacy and data

The demo:

- does not collect data
- does not connect to external services
- does not require authentication
- operates entirely with static, mock content

For real usage details, refer to the extension documentation and privacy policy.