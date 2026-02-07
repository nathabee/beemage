#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEMO_DIR="${ROOT_DIR}/demo"
cd "$ROOT_DIR"

[[ -f VERSION ]] || { echo "VERSION file missing"; exit 1; }
ver="$(tr -d ' \t\r\n' < VERSION)"

# 1) Build demo (vite.config.ts ensures OpenCV is present in demo/public before build)
( cd "$DEMO_DIR" && npm ci && npm run build )

# 2) Sanity check
[[ -d "$DEMO_DIR/dist" ]] || { echo "Missing demo/dist/ (build failed?)"; exit 1; }
[[ -f "$DEMO_DIR/dist/index.html" ]] || { echo "Missing demo/dist/index.html"; exit 1; }

# Ensure OpenCV made it into dist (because it's under public/)
[[ -f "$DEMO_DIR/dist/assets/opencv/opencv.js" ]] || { echo "Missing dist/assets/opencv/opencv.js"; exit 1; }
[[ -f "$DEMO_DIR/dist/assets/opencv/opencv.wasm" ]] || { echo "Missing dist/assets/opencv/opencv.wasm"; exit 1; }

# 3) Create zip
OUT_DIR="release"
mkdir -p "$OUT_DIR"

ZIP_NAME="beemage-demo-${ver}.zip"
ZIP_PATH="${OUT_DIR}/${ZIP_NAME}"
rm -f "$ZIP_PATH"

(
  cd "$DEMO_DIR/dist"
  zip -qr "../../${ZIP_PATH}" . \
    -x "*.map"
)

echo "Built: ${ZIP_PATH}"
ls -lh "$ZIP_PATH"
