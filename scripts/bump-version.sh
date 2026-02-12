#!/usr/bin/env bash
# scripts/bump-version.sh
set -euo pipefail

BUMP="${1:-patch}"  # major | minor | patch
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

[[ -f VERSION ]] || { echo "VERSION file missing"; exit 1; }

old="$(tr -d ' \t\r\n' < VERSION)"
IFS=. read -r MA MI PA <<< "$old"

case "$BUMP" in
  major) MA=$((MA+1)); MI=0; PA=0 ;;
  minor) MI=$((MI+1)); PA=0 ;;
  patch) PA=$((PA+1)) ;;
  *)
    echo "Usage: $0 [major|minor|patch]"
    exit 1
    ;;
esac

new="${MA}.${MI}.${PA}"
echo "$new" > VERSION

update_json_version() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  node -e '
    const fs = require("fs");
    const f = process.argv[1];
    const v = fs.readFileSync("VERSION","utf8").trim();
    const j = JSON.parse(fs.readFileSync(f,"utf8"));
    j.version = v;
    fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
  ' "$file"
}

# Extension manifest + package
update_json_version "apps/extension/manifest.json"
update_json_version "apps/extension/package.json"

# Demo package
update_json_version "apps/demo/package.json"

# Android-web package (if it exists)
update_json_version "apps/android-web/package.json"

# Shared version constant (used by demo/android-web/etc.)
node -e '
  const fs = require("fs");
  const v = fs.readFileSync("VERSION","utf8").trim();
  const p = "src/shared/version.ts";
  const out = `// src/shared/version.ts\n// Auto-generated. Do not edit by hand.\nexport const APP_VERSION = "${v}";\n`;
  fs.writeFileSync(p, out);
'

git add VERSION \
  apps/extension/manifest.json \
  apps/extension/package.json \
  apps/demo/package.json \
  apps/android-web/package.json \
  src/shared/version.ts 2>/dev/null || true

echo "Bumped: $old -> $new"
echo "Staged version files. Commit when ready."
