# Developer Guide

This document is intended for developers working on **BeeMage — Extract the main outline**.

## Project Structure

The repository is organized to separate concerns clearly:

- `src/` — source code
- `assets/` — icons and static resources
- `scripts/` — build and utility scripts
- `docs/` — documentation
- `tools/` — template and initialization utilities

## Development Workflow

Typical workflow:

1. Install dependencies
2. Run the development build
3. Load the extension in Chrome
4. Iterate on source code
5. Rebuild and reload as needed

## Initialization Scripts

The project includes initialization scripts using `GENERIC*` placeholders.

These scripts are intended to be run **once**, when creating a new project from the template.

After initialization:
- Verify all placeholders are replaced
- Remove the `tools/` directory if no longer needed

## Coding Guidelines

- Keep logic explicit
- Avoid unused permissions
- Prefer small, testable modules
- Document non-obvious behavior