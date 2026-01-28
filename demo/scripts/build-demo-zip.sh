#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEMO_DIR="${ROOT_DIR}/demo"
cd "$ROOT_DIR"

[[ -f VERSION ]] || { echo "VERSION file missing"; exit 1; }
ver="$(tr -d ' \t\r\n' < VERSION)"

# 1) Build demo
( cd "$DEMO_DIR" && npm ci && npm run build )

# 2) Sanity check
[[ -d "$DEMO_DIR/dist" ]] || { echo "Missing demo/dist/ (build failed?)"; exit 1; }
[[ -f "$DEMO_DIR/dist/index.html" ]] || { echo "Missing demo/dist/index.html"; exit 1; }
[[ -d "$DEMO_DIR/dist/assets" ]] || { echo "Missing demo/dist/assets/"; exit 1; }

# 2b) Copy OpenCV runtime assets into demo dist (optional, but required for OpenCV engine)
OPENCV_SRC="${ROOT_DIR}/assets/opencv"
OPENCV_DST="${DEMO_DIR}/dist/assets/opencv"

if [[ -d "$OPENCV_SRC" ]]; then
  mkdir -p "$OPENCV_DST"

  # Copy only runtime assets (exclude dev helpers / git keepers)
  if [[ -f "${OPENCV_SRC}/opencv.js" ]]; then
    cp "${OPENCV_SRC}/opencv.js" "${OPENCV_DST}/opencv.js"
  fi

  if [[ -f "${OPENCV_SRC}/opencv.wasm" ]]; then
    cp "${OPENCV_SRC}/opencv.wasm" "${OPENCV_DST}/opencv.wasm"
  fi

  # Optional: if you ever add other runtime files, copy them explicitly here.
  echo "Copied OpenCV runtime assets to demo: ${OPENCV_DST}"
  ls -lh "${OPENCV_DST}" || true
else
  echo "Note: ${OPENCV_SRC} not found. Demo will not be able to load OpenCV."
fi

# 3) Create zip
OUT_DIR="release"
mkdir -p "$OUT_DIR"

ZIP_NAME="beecontour-demo-${ver}.zip"
ZIP_PATH="${OUT_DIR}/${ZIP_NAME}"

rm -f "$ZIP_PATH"

# Zip demo/dist contents (not the folder itself)
# Exclusions:
# - source maps (optional; add if you want parity with extension zip)
# - any stray helper files if they ended up in dist
(
  cd "$DEMO_DIR/dist"
  zip -qr "../../${ZIP_PATH}" . \
    -x "*.map" \
    -x "assets/opencv/.keep" \
    -x "assets/opencv/get-opencv.sh"
)

echo "Built: ${ZIP_PATH}"
ls -lh "$ZIP_PATH"
