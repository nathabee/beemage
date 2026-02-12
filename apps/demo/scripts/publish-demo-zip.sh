#!/usr/bin/env bash
# apps/demo/scripts/publish-demo-zip.sh
set -euo pipefail

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "${DEMO_DIR}/../../.." && pwd)"
cd "$ROOT_DIR"

die() { echo "ERROR: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

need git
need gh

[[ -f VERSION ]] || die "VERSION file missing"
ver="$(tr -d ' \t\r\n' < VERSION)"
tag="v${ver}"

ZIP="release/beemage-demo-${ver}.zip"
[[ -f "$ZIP" ]] || die "Missing $ZIP. Run: ./apps/demo/scripts/build-demo-zip.sh"

[[ -z "$(git status --porcelain)" ]] || die "Working tree not clean. Commit/stash first."
gh auth status >/dev/null 2>&1 || die "gh not authenticated. Run: gh auth login"

gh release view "$tag" >/dev/null 2>&1 || die "Release $tag not found. Create it first (publish extension release)."

gh release upload "$tag" "$ZIP" --clobber
echo "Done: uploaded $(basename "$ZIP") to release $tag."
