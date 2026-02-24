#!/usr/bin/env bash
# scripts/build-icons.sh
#
# Generates resized RGBA PNG icons from /assets/design-icon.png
# Output:
#   /assets/design-icon-16.png
#   /assets/design-icon-32.png
#   /assets/design-icon-48.png
#   /assets/design-icon-128.png
#   /assets/design-icon-512.png (F-Droid compliant: 512x512 PNG32 RGBA)

#!/usr/bin/env bash
# scripts/build-icons.sh
#
# Generates resized RGBA PNG icons from /assets/design-icon.png
# Compatible with ImageMagick v6 (convert) and v7 (magick)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS_DIR="$ROOT_DIR/assets"
SRC="$ASSETS_DIR/design-icon.png"

if [[ ! -f "$SRC" ]]; then
  echo "ERROR: Source file not found: $SRC"
  exit 1
fi

# Detect ImageMagick binary
if command -v magick >/dev/null 2>&1; then
  IM="magick"
elif command -v convert >/dev/null 2>&1; then
  IM="convert"
else
  echo "ERROR: ImageMagick not installed (magick/convert not found)"
  exit 1
fi

sizes=(16 32 48 128 512)

echo "Using ImageMagick: $IM"
echo "Building icons from: $SRC"
echo

for size in "${sizes[@]}"; do
  OUT="$ASSETS_DIR/design-icon-${size}.png"

  "$IM" "$SRC" \
    -resize "${size}x${size}" \
    -background none \
    -gravity center \
    -extent "${size}x${size}" \
    -alpha on \
    -define png:color-type=6 \
    PNG32:"$OUT"

  echo "✓ Created $OUT"
done

echo
echo "Done."