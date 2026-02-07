#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

die() { echo "ERROR: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

need git
need node
need npm
need zip
need gh

DOCS_COMMIT_MSG="${1:-}"

[[ -f VERSION ]] || die "VERSION file missing"
ver="$(tr -d ' \t\r\n' < VERSION)"
[[ -n "$ver" ]] || die "VERSION is empty"
tag="v${ver}"

echo "=== release-all ==="
echo "Version: $ver"
echo "Tag:     $tag"
echo

# 0) Guard: refuse unrelated local changes (only allow docs demo paths to be touched by this script)
dirty_outside_allowed="$(
  git status --porcelain |
    awk '{
      p=$2;
      if (p ~ /^docs\/demo(\/|$)/) next;
      if (p == "docs/index.html") next;
      # ignore these if they appear as build byproducts
      if (p ~ /^(dist|demo\/dist|release)(\/|$)/) next;
      print;
    }'
)"
[[ -z "$dirty_outside_allowed" ]] || {
  echo "Unrelated local changes detected:"
  echo "$dirty_outside_allowed"
  die "Commit/stash these first, then rerun."
}

# 1) Build extension zip
echo "== 1) Build extension zip =="
./scripts/build-zip.sh

# 2) Build demo zip (also produces demo/dist)
echo
echo "== 2) Build demo zip =="
./demo/scripts/build-demo-zip.sh
 
# 3) Publish demo/dist -> docs/demo for GitHub Pages (diff-aware)

# for info:
# 1. **Source of truth (repo root):**
#   `/assets/pipelines/*.json`
# 2. **Demo build pre-step (Vite plugin, before Vite copies `public/`):**
#   `ensurePipelinesPublicPlugin()` copies
#   `/assets/pipelines/*.json` → `/demo/public/assets/pipelines/*.json`
# 3. **Vite build static copy rule:**
#   Vite copies `demo/public/**` into `demo/dist/**`, so:
#   `/demo/public/assets/pipelines/*.json` → `/demo/dist/assets/pipelines/*.json`
# 4. **GitHub Pages publish step (release-all.sh rsync):**
#   `rsync demo/dist/ → docs/demo/` so:
#   `/demo/dist/assets/pipelines/*.json` → `/docs/demo/assets/pipelines/*.json`


echo
echo "== 3) Publish demo to GitHub Pages (docs/demo) =="

DEMO_DIST="${ROOT_DIR}/demo/dist"
DOCS_DEMO="${ROOT_DIR}/docs/demo"
ASSETS_SRC="${ROOT_DIR}/assets"
ASSETS_DST="${ROOT_DIR}/docs/assets"

[[ -d "$DEMO_DIST" ]] || die "Missing $DEMO_DIST (demo build failed?)"

mkdir -p "$DOCS_DEMO"

# Sync demo build → docs/demo (only changed files)
rsync -a --delete --checksum \
  "$DEMO_DIST"/ \
  "$DOCS_DEMO"/

# Optional: commit runtime/assets for GitHub Pages reproducible builds
# - OpenCV runtime (if you keep it committed under docs/assets/opencv)
# - Pipeline examples JSON (committed under docs/assets/pipelines)

mkdir -p "$ASSETS_DST/opencv" "$ASSETS_DST/pipelines"

# OpenCV runtime (only if present in repo assets/)
if [[ -d "$ASSETS_SRC/opencv" ]]; then
  rsync -a --delete --checksum \
    "$ASSETS_SRC/opencv"/ \
    "$ASSETS_DST/opencv"/
fi

# Pipeline example JSON (source-of-truth = repo root assets/pipelines)
if [[ -d "$ASSETS_SRC/pipelines" ]]; then
  rsync -a --delete --checksum \
    "$ASSETS_SRC/pipelines"/ \
    "$ASSETS_DST/pipelines"/
fi


echo "Demo published to $DOCS_DEMO (diff-aware)"

 


# 4) Commit + push docs demo (only if changed)
echo
echo "== 4) Commit + push docs demo =="

# Stage docs output (force add in case a .gitignore rule matches)
git add -f -A -- docs/demo docs/index.html docs/assets/opencv docs/assets/pipelines 2>/dev/null || true


# If staging produced changes, commit + push
if ! git diff --cached --quiet; then
  git commit -m "docs(demo): publish demo ${ver}"
  git push origin HEAD
  echo "Committed + pushed docs demo for ${ver}"
else
  echo "No docs changes to commit."
fi


echo
echo "== 5) Publish GitHub release + upload extension zip =="
./scripts/publish-release-zip.sh

# 6) Optional: Publish GitHub release + upload artifacts
echo
echo "== 6) GitHub Release (optional) =="

echo "OpenCV assets can make release artifacts large."
echo "Recommendation: publish releases only for milestones / major versions, or when you have users."
echo

# Non-interactive override (optional):
#   BCT_RELEASE=yes ./scripts/release-all.sh
#   BCT_RELEASE=no  ./scripts/release-all.sh
release_choice="${BCT_RELEASE:-}"

if [[ -z "$release_choice" ]]; then
  read -r -p "Publish GitHub Release and upload zips for ${tag}? [y/N] " release_choice
fi

case "${release_choice,,}" in
  y|yes)

    echo
    echo "== 6) Upload demo zip to same release =="
    ./demo/scripts/publish-demo-zip.sh

    ;;
  *)
    echo "Skipping GitHub Release demo upload (default)."
    ;;
esac


echo
echo "Release published for $tag"