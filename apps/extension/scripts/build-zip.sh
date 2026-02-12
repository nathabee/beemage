#!/usr/bin/env bash
# apps/extension/scripts/build-zip.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"      # apps/extension
ROOT_DIR="$(cd "${APP_DIR}/../.." && pwd)"                      # repo root
export ROOT_DIR

cd "$APP_DIR"

[[ -f "${ROOT_DIR}/VERSION" ]] || { echo "VERSION file missing"; exit 1; }
ver="$(tr -d ' \t\r\n' < "${ROOT_DIR}/VERSION")"

# 1) Build (in apps/extension)
npm run build

# 2) Sanity check
[[ -d dist ]] || { echo "Missing dist/ (build failed?)"; exit 1; }
[[ -f dist/manifest.json ]] || { echo "Missing dist/manifest.json"; exit 1; }

 
# 3) Ensure dist manifest version matches VERSION (hard fail if not)
node -e '
  const fs=require("fs");
  const root=process.env.ROOT_DIR;
  if (!root) {
    console.error("ROOT_DIR env var not set");
    process.exit(1);
  }
  const v=fs.readFileSync(`${root}/VERSION`,"utf8").trim();
  const j=JSON.parse(fs.readFileSync("dist/manifest.json","utf8"));
  if (j.version !== v) {
    console.error(`dist/manifest.json version (${j.version}) != VERSION (${v}). Run scripts/bump-version.sh first.`);
    process.exit(1);
  }
'


# 4) Hard fail if sourcemaps are present in dist
if find dist -type f -name "*.map" -print -quit | grep -q .; then
  echo "ERROR: Sourcemap files (*.map) found in dist/. Do not upload these to Chrome Web Store."
  echo "Found:"
  find dist -type f -name "*.map" -print
  exit 1
fi

# 5) Create zip
OUT_DIR="${ROOT_DIR}/release"
mkdir -p "$OUT_DIR"

ZIP_PATH="${OUT_DIR}/beemage-${ver}.zip"
rm -f "$ZIP_PATH"

(
  cd dist
  zip -qr "$ZIP_PATH" . \
    -x "*.map" \
    -x "*.svg"
)

echo "Built: ${ZIP_PATH}"
ls -lh "$ZIP_PATH"

echo
echo "ZIP contents (top level):"
unzip -l "$ZIP_PATH" | sed -n '1,40p'
