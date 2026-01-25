# Installation

This document explains how to install **BeeContour — Extract the main outline** locally for development.

## Requirements

- Google Chrome (or Chromium-based browser)
- Node.js (version depends on the project setup)
- Git

## Install Dependencies

From the project root:

```bash
npm install
````

## Build the Extension

```bash
npm run build
```

This generates the production-ready extension files.

## Load in Chrome (Developer Mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the build output directory

The extension will now be available locally.

## Notes

This project is client-side only.
No external services are required to run the extension.
