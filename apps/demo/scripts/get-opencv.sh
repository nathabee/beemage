#!/usr/bin/env bash
# apps/demo/scripts/get-opencv.sh
set -euo pipefail

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"     # apps/demo
ROOT_DIR="$(cd "${DEMO_DIR}/../.." && pwd)"                      # repo root

PKG_DIR="$DEMO_DIR/node_modules/@opencv.js/wasm"
SRC_JS="$PKG_DIR/opencv.js"
SRC_WASM="$PKG_DIR/opencv.wasm"

if [[ ! -f "$SRC_JS" || ! -f "$SRC_WASM" ]]; then
  echo "ERROR: OpenCV runtime not found in: $PKG_DIR"
  echo "Run: (cd apps/demo && npm install)"
  exit 1
fi

copy_if_changed() {
  local src="$1"
  local dst="$2"
  mkdir -p "$(dirname "$dst")"
  if [[ -f "$dst" ]] && cmp -s "$src" "$dst"; then return 0; fi
  cp -f "$src" "$dst"
}

# 1) Canonical runtime for GitHub Pages (committed)
DOCS_DST="$ROOT_DIR/docs/assets/opencv"
copy_if_changed "$SRC_JS"   "$DOCS_DST/opencv.js"
copy_if_changed "$SRC_WASM" "$DOCS_DST/opencv.wasm"
echo "Ensured: docs/assets/opencv"
ls -lh "$DOCS_DST/opencv.js" "$DOCS_DST/opencv.wasm"

# 2) Demo runtime for Vite public/ (generated)
DEMO_PUBLIC_DST="$DEMO_DIR/public/assets/opencv"
copy_if_changed "$SRC_JS"   "$DEMO_PUBLIC_DST/opencv.js"
copy_if_changed "$SRC_WASM" "$DEMO_PUBLIC_DST/opencv.wasm"
echo "Ensured: apps/demo/public/assets/opencv"
ls -lh "$DEMO_PUBLIC_DST/opencv.js" "$DEMO_PUBLIC_DST/opencv.wasm"
