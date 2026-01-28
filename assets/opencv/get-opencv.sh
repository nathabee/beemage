#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PKG_DIR="node_modules/@opencv.js/wasm"

if [[ ! -d "$PKG_DIR" ]]; then
  echo "ERROR: $PKG_DIR not found."
  echo "Run: npm install"
  exit 1
fi

# ---- 1) Copy OpenCV runtime into repo assets/ ----
mkdir -p assets/opencv

cp "$PKG_DIR/opencv.js" assets/opencv/opencv.js
cp "$PKG_DIR/opencv.wasm" assets/opencv/opencv.wasm

echo "OpenCV assets written:"
ls -lh assets/opencv/opencv.js assets/opencv/opencv.wasm

# ---- 2) Make demo/public/assets/opencv point to the same runtime ----
mkdir -p demo/public/assets

LINK_PATH="demo/public/assets/opencv"

# Remove existing link/dir if present 
rm -rf "$LINK_PATH" 
mkdir "$LINK_PATH" 
ln -s ../../../../assets/opencv/opencv.js "$LINK_PATH"/opencv.js
ln -s ../../../../assets/opencv/opencv.wasm "$LINK_PATH"/opencv.wasm

echo "Demo OpenCV link created:"
ls -la "$LINK_PATH"

