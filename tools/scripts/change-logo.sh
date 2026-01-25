#!/usr/bin/env bash
set -euo pipefail

echo "NOTE: initialization script. After verification, remove /tools."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

SRC_DIR="tools/templates/docs"
die() { echo "ERROR: $*" >&2; exit 1; }

[[ -d "docs" ]] || die "Missing /docs directory"
[[ -d "${SRC_DIR}" ]] || die "Missing ${SRC_DIR}"
[[ -x "tools/scripts/make-icon.sh" ]] || die "Missing tools/scripts/make-icon.sh (or not executable)"

echo "== change-logo =="
echo "Copying SVG assets from tools/templates/docs -> docs/"
echo

FILES=(
  "logo.svg"
  "logo-demo.svg"
  "visitgithubpage.svg"
  "icon.svg"
)

for f in "${FILES[@]}"; do
  [[ -f "${SRC_DIR}/${f}" ]] || die "Missing template file: ${SRC_DIR}/${f}"
  cp -f "${SRC_DIR}/${f}" "docs/${f}"
  echo "  installed docs/${f}"
done

# Ensure placeholders were already resolved by change-name.sh
LEFT="$(
  grep -nH "GENERIC_" docs/logo.svg docs/logo-demo.svg docs/visitgithubpage.svg docs/icon.svg 2>/dev/null || true
)"
if [[ -n "${LEFT}" ]]; then
  echo
  echo "Placeholders still present in installed SVGs:"
  echo "${LEFT}"
  echo
  die "Run ./tools/scripts/change-name.sh first (it must resolve tools/templates before copying)."
fi

echo
echo "Generating PNG icons into /assets from docs/icon.svg ..."
./tools/scripts/make-icon.sh

echo
echo "OK: SVG docs updated + PNG icons generated."
