#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ANDROID_WEB_DIR="${ROOT_DIR}/android"
WRAPPER_ASSETS_DIR="${ROOT_DIR}/android-wrapper/app/src/main/assets/"

echo "=== build-android ==="
echo "Repo:     ${ROOT_DIR}"
echo "Web:      ${ANDROID_WEB_DIR}"
echo "Wrapper:  ${WRAPPER_ASSETS_DIR}"
echo

# 1) Build the Android web bundle
cd "${ANDROID_WEB_DIR}"

# Use npm ci for reproducible installs (requires package-lock.json)
npm ci
npm run build

# 2) Replace wrapper assets with the freshly built dist
mkdir -p "${WRAPPER_ASSETS_DIR}"

# Clear old assets to avoid stale hashed JS files
rm -rf "${WRAPPER_ASSETS_DIR:?}/"*

# Copy dist contents into wrapper assets
# (dot-copy keeps folders and files; avoids glob quoting issues)
cp -Ra "${ANDROID_WEB_DIR}/dist/." "${WRAPPER_ASSETS_DIR}/"
 
echo
echo "Copied bundle into wrapper assets."
echo "Done."
