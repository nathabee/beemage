#!/usr/bin/env bash
set -euo pipefail

command -v convert >/dev/null 2>&1 || {
  echo "ERROR: ImageMagick is required (missing 'convert')." >&2
  echo "Install: sudo apt install imagemagick" >&2
  exit 1
}

[[ -f "docs/icon.svg" ]] || {
  echo "ERROR: missing docs/icon.svg" >&2
  echo "Run: ./tools/scripts/change-logo.sh first" >&2
  exit 1
}

mkdir -p assets

for s in 16 32 48 128; do
  convert "docs/icon.svg" -resize "${s}x${s}" "assets/icon-${s}.png"
done

echo "OK: generated assets/icon-{16,32,48,128}.png from docs/icon.svg"
