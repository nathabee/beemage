# Architecture

This document describes the high-level architecture of **BeeContour — Extract the main outline**.

## Overview

The extension follows the standard **Chrome Manifest V3** architecture:

- Background logic runs in a **service worker**
- UI components are isolated (popup / panel / pages)
- Static assets are bundled and referenced explicitly
- No runtime remote code execution

## Main Components

- **manifest.json**  
  Declares permissions, entry points, and extension metadata.

- **Background / Service Worker**  
  Handles long-lived logic, message routing, and Chrome APIs.

- **UI Layer**  
  Optional popup, panel, or extension pages for user interaction.

- **Assets**  
  Icons and static resources bundled with the extension.

## Design Principles

- Explicit over implicit
- Minimal permissions
- No hidden side effects
- Clear data flow between components

This architecture is intended to stay understandable even as features grow.
