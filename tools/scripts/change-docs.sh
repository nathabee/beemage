#!/usr/bin/env bash
set -euo pipefail

echo "NOTE: this is an initialization script. After verification, remove /tools."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TEMPL_ROOT="tools/templates"
TEMPL_DOCS="${TEMPL_ROOT}/docs"
TEMPL_README="${TEMPL_ROOT}/README.md"
die() { echo "ERROR: $*" >&2; exit 1; }

[[ -d "docs" ]] || die "Missing /docs directory"
[[ -d "${TEMPL_DOCS}" ]] || die "Missing ${TEMPL_DOCS}"
[[ -f "${TEMPL_README}" ]] || die "Missing ${TEMPL_README}"

echo "== change-docs =="
echo "Overwriting README.md and docs/* from tools/templates (no placeholder replacement here)."
echo

# 1) README
cp -f "${TEMPL_README}" "README.md"

# 2) docs templates (only files present in templates/docs)
for src in "${TEMPL_DOCS}"/*; do
  base="$(basename "${src}")"
  cp -f "${src}" "docs/${base}"
done

# Sanity: require that placeholders are already resolved
LEFT="$(
  grep -nH "GENERIC_" README.md docs/* 2>/dev/null || true
)"
if [[ -n "${LEFT}" ]]; then
  echo
  echo "Placeholders still present in installed docs:"
  echo "${LEFT}"
  echo
  die "Run ./tools/scripts/change-name.sh first (it must resolve tools/templates before copying)."
fi

echo "OK: README.md + docs templates installed."
echo "Next:"
echo "  ./tools/scripts/change-logo.sh"
# echo "  ./tools/scripts/make-icon.sh"
echo "  git status"
echo "  git add README.md docs"
echo "  npm install"
echo "  npm run build"

