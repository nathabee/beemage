#!/usr/bin/env bash
# scripts/synchronise-fdroid.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_REPO="$ROOT_DIR"

# Expected workspace layout:
# <workspace>/beemage
# <workspace>/beemage-fdroid
DEFAULT_DST_REPO="$(cd "$ROOT_DIR/.." && pwd)/beemage-fdroid"
DST_REPO="${1:-$DEFAULT_DST_REPO}"

die() { echo "ERROR: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

need rsync
need git

[[ -d "$DST_REPO/.git" ]] || die "Destination is not a git repo (missing .git): $DST_REPO"

echo "=== synchronise-fdroid ==="
echo "From: $SRC_REPO"
echo "To:   $DST_REPO"
echo

# Canonical docs that will be mirrored into beemage-fdroid
CANON_DOC_ROOT="$SRC_REPO/docs/fdroid"
CANON_DOC_README="$CANON_DOC_ROOT/README.md"
CANON_DOC_TESTER="$CANON_DOC_ROOT/tester.md"

[[ -f "$CANON_DOC_README" ]] || die "Missing canonical doc: $CANON_DOC_README"
[[ -f "$CANON_DOC_TESTER" ]] || die "Missing canonical doc: $CANON_DOC_TESTER"

# Safety: refuse if destination has uncommitted changes
if [[ -n "$(git -C "$DST_REPO" status --porcelain)" ]]; then
  die "Destination repo has uncommitted changes. Commit/stash them first: $DST_REPO"
fi

# Define what to mirror (minimal but sufficient for android-web + android-native build)
# NOTE: assets/pipelines is required by android-web build (vite config expects it).
INCLUDE_PATHS=(
  "VERSION"
  "LICENSE"
  "tsconfig.paths.json"
  "src/"
  "fastlane/"
  "apps/android-web/"
  "apps/android-native/"
  "assets/pipelines/"
)

# Exclusions inside included paths (generated outputs, secrets, non-reproducible artifacts)
RSYNC_EXCLUDES=(
  "--exclude=node_modules/"
  "--exclude=dist/"
  "--exclude=.cache/"
  "--exclude=.vite/"
  "--exclude=.turbo/"
  "--exclude=.next/"
  "--exclude=coverage/"
  "--exclude=*.log"
  "--exclude=.DS_Store"
  "--exclude=.idea/"
  "--exclude=*.iml"
  "--exclude=.gradle/"
  "--exclude=**/build/"
  "--exclude=local.properties"
  "--exclude=release/"
  "--exclude=keystore.properties"
  "--exclude=*.jks"
  "--exclude=*.keystore"
  # android-web output copied into wrapper assets (must be generated during build)
  "--exclude=app/src/main/assets/**"
  # never mirror local testing file
  "--exclude=.fdroid.yml"
)

echo "== Cleaning destination mirrored paths =="
for p in "${INCLUDE_PATHS[@]}"; do
  rm_target="${p%/}"
  if [[ -e "$DST_REPO/$rm_target" ]]; then
    echo " - rm -rf $DST_REPO/$rm_target"
    rm -rf "$DST_REPO/$rm_target"
  fi
done

# Clean mirror docs locations that must be canonical-derived only
if [[ -e "$DST_REPO/docs" ]]; then
  echo " - rm -rf $DST_REPO/docs"
  rm -rf "$DST_REPO/docs"
fi
if [[ -e "$DST_REPO/README.md" ]]; then
  echo " - rm -f $DST_REPO/README.md"
  rm -f "$DST_REPO/README.md"
fi

# Ensure destination skeleton exists
mkdir -p "$DST_REPO/src" "$DST_REPO/apps" "$DST_REPO/assets/pipelines" "$DST_REPO/docs/fdroid"

echo
echo "== Mirroring selected paths =="
for p in "${INCLUDE_PATHS[@]}"; do
  src="$SRC_REPO/$p"
  [[ -e "$src" ]] || die "Missing source path: $src"

  mkdir -p "$(dirname "$DST_REPO/$p")"

  echo " - $p"
  if [[ -d "$src" ]]; then
    rsync -a --delete \
      "${RSYNC_EXCLUDES[@]}" \
      "$src" "$DST_REPO/$p"
  else
    rsync -a --checksum \
      "${RSYNC_EXCLUDES[@]}" \
      "$src" "$DST_REPO/$p"
  fi
done

echo
echo "== Mirroring canonical F-Droid docs =="
echo " - docs/fdroid/README.md -> (mirror) README.md"
rsync -a --checksum "$CANON_DOC_README" "$DST_REPO/README.md"

echo " - docs/fdroid/tester.md -> (mirror) docs/fdroid/tester.md"
rsync -a --checksum "$CANON_DOC_TESTER" "$DST_REPO/docs/fdroid/tester.md"

echo
echo "== Post-sync info =="
echo "Destination status:"
git -C "$DST_REPO" status --porcelain || true
echo

cat <<'NEXT'
Next steps (in beemage-fdroid):
  cd ../beemage-fdroid
  git add -A
  git commit -m "sync: update mirror from beemage"
  git push

Local fdroidserver test (optional):
  cd ../beemage-fdroid
  cp -f apps/android-native/scripts/fdroid-template.yml .fdroid.yml
  fdroid readmeta
  fdroid build
NEXT
