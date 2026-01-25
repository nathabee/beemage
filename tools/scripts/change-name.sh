#!/usr/bin/env bash
set -euo pipefail

echo "NOTE: this is an initialization script. After verification, remove /tools."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

CONF="tools/scripts/change-name.conf"
die() { echo "ERROR: $*" >&2; exit 1; }

[[ -f "$CONF" ]] || die "Missing $CONF"
[[ -f "package.json" && -f "manifest.json" ]] || die "Run from repo root (missing package.json/manifest.json)"

# shellcheck disable=SC1090
source "$CONF"

: "${GENERIC_GITHUBUSER:?Missing GENERIC_GITHUBUSER in tools/scripts/change-name.conf}"
: "${GENERIC_PROJECT_CODE:?Missing GENERIC_PROJECT_CODE in tools/scripts/change-name.conf}"
: "${GENERIC_PROJECT_NAME:?Missing GENERIC_PROJECT_NAME in tools/scripts/change-name.conf}"
: "${GENERIC_PROJECT_DESCRIPTION:?Missing GENERIC_PROJECT_DESCRIPTION in tools/scripts/change-name.conf}"
: "${GENERIC_PROJECT_VERSION:=0.0.0}"

: "${GENERIC_PROJECT_HOMEPAGE_URL:=https://${GENERIC_GITHUBUSER}.github.io/${GENERIC_PROJECT_CODE}/}"
: "${GENERIC_PROJECT_SUPPORT_URL:=https://github.com/${GENERIC_GITHUBUSER}/${GENERIC_PROJECT_CODE}/issues}"

: "${GENERIC_TRIGRAMME:?Missing GENERIC_TRIGRAMME in tools/scripts/change-name.conf}"
: "${GENERIC_LOGO_PART1:=GENERIC_TRIGRAMME}"
: "${GENERIC_LOGO_PART2:=}"
: "${GENERIC_SLOGAN:=}"

if [[ ! "${GENERIC_PROJECT_CODE}" =~ ^[a-z0-9][a-z0-9-]+$ ]]; then
  die "GENERIC_PROJECT_CODE must be lowercase, alphanumeric, hyphens only"
fi




echo "== change-name =="
echo "Using config:"
echo "  GENERIC_GITHUBUSER:           ${GENERIC_GITHUBUSER}"
echo "  GENERIC_PROJECT_CODE:         ${GENERIC_PROJECT_CODE}"
echo "  GENERIC_PROJECT_NAME:         ${GENERIC_PROJECT_NAME}"
echo "  GENERIC_PROJECT_DESCRIPTION:  ${GENERIC_PROJECT_DESCRIPTION}"
echo "  GENERIC_PROJECT_VERSION:      ${GENERIC_PROJECT_VERSION}"
echo "  GENERIC_PROJECT_HOMEPAGE_URL: ${GENERIC_PROJECT_HOMEPAGE_URL}"
echo "  GENERIC_PROJECT_SUPPORT_URL:  ${GENERIC_PROJECT_SUPPORT_URL}"
echo "  GENERIC_TRIGRAMME:            ${GENERIC_TRIGRAMME}"
echo "  GENERIC_LOGO_PART1:           ${GENERIC_LOGO_PART1}"
echo "  GENERIC_LOGO_PART2:           ${GENERIC_LOGO_PART2}"
echo "  GENERIC_SLOGAN:               ${GENERIC_SLOGAN}"
echo

echo "Finding files containing GENERIC_ (excluding tools/scripts and build outputs)..."
 
sed_escape_repl() {
  # Escape for sed replacement part:
  # - backslash
  # - ampersand (which expands to matched text)
  # - delimiter '|' (we use it below)
  printf '%s' "$1" | sed -e 's/[\/&|\\]/\\&/g'
}

R_GITHUBUSER="$(sed_escape_repl "${GENERIC_GITHUBUSER}")"
R_PROJECT_CODE="$(sed_escape_repl "${GENERIC_PROJECT_CODE}")"
R_PROJECT_NAME="$(sed_escape_repl "${GENERIC_PROJECT_NAME}")"
R_PROJECT_DESCRIPTION="$(sed_escape_repl "${GENERIC_PROJECT_DESCRIPTION}")"
R_PROJECT_VERSION="$(sed_escape_repl "${GENERIC_PROJECT_VERSION}")"
R_TRIGRAMME="$(sed_escape_repl "${GENERIC_TRIGRAMME}")"
R_LOGO_PART1="$(sed_escape_repl "${GENERIC_LOGO_PART1}")"
R_LOGO_PART2="$(sed_escape_repl "${GENERIC_LOGO_PART2}")"
R_SLOGAN="$(sed_escape_repl "${GENERIC_SLOGAN}")"
R_HOMEPAGE_URL="$(sed_escape_repl "${GENERIC_PROJECT_HOMEPAGE_URL}")"
R_SUPPORT_URL="$(sed_escape_repl "${GENERIC_PROJECT_SUPPORT_URL}")"


FILES="$(
  find . \
    -path './.git' -prune -o \
    -path './node_modules' -prune -o \
    -path './dist' -prune -o \
    -path './build' -prune -o \
    -path './release' -prune -o \
    -path './demo/node_modules' -prune -o \
    -path './demo/dist' -prune -o \
    -path './tools/scripts' -prune -o \
    -type f -print0 \
  | xargs -0 grep -l 'GENERIC_' \
  | sed -e 's#^\./##' \
  || true
)"



if [[ -z "${FILES}" ]]; then
  echo "No GENERIC_ placeholders found. (Maybe already initialized?)"
else
  echo "Replacing placeholders in:"
  echo "${FILES}" | sed 's/^/  - /'
  echo

  # Replace placeholders
  # Notes:
  # - Use # delimiter for URLs
  # - Keep replacements simple; avoid sed escaping complexity by assuming sane values in conf
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    sed -i \
      -e "s|GENERIC_GITHUBUSER|${R_GITHUBUSER}|g" \
      -e "s|GENERIC_PROJECT_CODE|${R_PROJECT_CODE}|g" \
      -e "s|GENERIC_PROJECT_NAME|${R_PROJECT_NAME}|g" \
      -e "s|GENERIC_PROJECT_DESCRIPTION|${R_PROJECT_DESCRIPTION}|g" \
      -e "s|GENERIC_PROJECT_HOMEPAGE_URL|${R_HOMEPAGE_URL}|g" \
      -e "s|GENERIC_PROJECT_SUPPORT_URL|${R_SUPPORT_URL}|g" \
      -e "s|GENERIC_PROJECT_VERSION|${R_PROJECT_VERSION}|g" \
      -e "s|GENERIC_TRIGRAMME|${R_TRIGRAMME}|g" \
      -e "s|GENERIC_LOGO_PART1|${R_LOGO_PART1}|g" \
      -e "s|GENERIC_LOGO_PART2|${R_LOGO_PART2}|g" \
      -e "s|GENERIC_SLOGAN|${R_SLOGAN}|g" \
      "$f"
  done <<< "${FILES}"
fi


echo "Updating package.json (authoritative fields)..."
GENERIC_PROJECT_CODE="${GENERIC_PROJECT_CODE}" \
GENERIC_PROJECT_VERSION="${GENERIC_PROJECT_VERSION}" \
node - <<'NODE'
const fs = require("fs");

const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.name = process.env.GENERIC_PROJECT_CODE;
p.version = process.env.GENERIC_PROJECT_VERSION;

fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
NODE


echo "Updating manifest.json (authoritative fields)..."
GENERIC_PROJECT_NAME="${GENERIC_PROJECT_NAME}" \
GENERIC_PROJECT_VERSION="${GENERIC_PROJECT_VERSION}" \
GENERIC_PROJECT_DESCRIPTION="${GENERIC_PROJECT_DESCRIPTION}" \
GENERIC_GITHUBUSER="${GENERIC_GITHUBUSER}" \
GENERIC_PROJECT_HOMEPAGE_URL="${GENERIC_PROJECT_HOMEPAGE_URL}" \
node - <<'NODE'
const fs = require("fs");

const m = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
m.name = process.env.GENERIC_PROJECT_NAME;
m.version = process.env.GENERIC_PROJECT_VERSION;
m.description = process.env.GENERIC_PROJECT_DESCRIPTION;
m.author = process.env.GENERIC_GITHUBUSER;
m.homepage_url = process.env.GENERIC_PROJECT_HOMEPAGE_URL;

// Keep template coherent: no host_permissions by default
if (Array.isArray(m.host_permissions)) m.host_permissions = [];

if (m.action && typeof m.action === "object") {
  m.action.default_title = process.env.GENERIC_PROJECT_NAME;
}

fs.writeFileSync("manifest.json", JSON.stringify(m, null, 2) + "\n");
NODE

echo "Resetting VERSION..."
echo "${GENERIC_PROJECT_VERSION}" > VERSION

# Optional: rename root directory
CURRENT_DIR="$(basename "$(pwd)")"
if [[ "${CURRENT_DIR}" == "extension-generic" && "${GENERIC_PROJECT_CODE}" != "extension-generic" ]]; then
  echo "Renaming root directory: extension-generic -> ${GENERIC_PROJECT_CODE}"
  cd ..
  mv "extension-generic" "${GENERIC_PROJECT_CODE}"
  echo "OK. Re-enter:"
  echo "  cd ${GENERIC_PROJECT_CODE}"
  exit 0
fi

echo "Verifying no GENERIC_ placeholders remain (excluding tools/scripts and build outputs)..."
 LEFT="$(
  grep -R "GENERIC_" . \
    --exclude-dir=.git \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude-dir=release \
    --exclude-dir=demo/node_modules \
    --exclude-dir=demo/dist \
    --exclude-dir=scripts \
  | sed -e 's#^\./##' \
  | grep -vE '^tools/scripts/' \
  | grep -vE '^README\.md:' \
  || true
)"



if [[ -n "${LEFT}" ]]; then
  echo
  echo "Leftover placeholders detected:"
  echo "${LEFT}"
  echo
  die "Initialization incomplete: GENERIC_ placeholders remain."
fi

echo
echo "OK: placeholders replaced everywhere (including tools/templates)."
echo "Next:"
echo "  ./tools/scripts/change-docs.sh"
echo "  ./tools/scripts/change-logo.sh"
# echo "  ./tools/scripts/make-icon.sh"
echo "  npm install"
echo "  npm run build"
