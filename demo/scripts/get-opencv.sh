#!/usr/bin/env bash
set -euo pipefail



ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# opencv is just available for the demo
PKG_DIR="demo/node_modules/@opencv.js/wasm"

if [[ ! -d "$PKG_DIR" ]]; then
  echo "ERROR: $PKG_DIR not found."
  echo "Run: npm install"
  exit 1
fi

 
# Make demo/public/assets/opencv point to the same runtime ----
 
echo "OpenCV assets linked for the demo:"

LINK_PATH="demo/public/assets/opencv"

# Remove existing link/dir if present 
rm -rf "$LINK_PATH" 
mkdir "$LINK_PATH" 
ln -s ../../../node_modules/@opencv.js/wasm/opencv.js "$LINK_PATH"/opencv.js
ln -s ../../../node_modules/@opencv.js/wasm/opencv.wasm "$LINK_PATH"/opencv.wasm

echo "Demo OpenCV link created:"
ls -la "$LINK_PATH"

