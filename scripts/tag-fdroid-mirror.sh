#!/usr/bin/env bash
# scripts/tag-fdroid-mirror.sh
set -euo pipefail

die() { echo "ERROR: $*" >&2; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

[[ -f VERSION ]] || die "VERSION file missing"
ver="$(tr -d ' \t\r\n' < VERSION)"
[[ -n "$ver" ]] || die "VERSION is empty"

FDROID_REPO="${1:-${ROOT_DIR}/../beemage-fdroid}"
[[ -d "$FDROID_REPO/.git" ]] || die "Mirror repo not found: $FDROID_REPO"

tag="v${ver}-fdroid"

echo "== tag-fdroid-mirror =="
echo "Version: $ver"
echo "Mirror : $FDROID_REPO"
echo "Tag    : $tag"
echo

# Commit pending changes if any
dirty="$(git -C "$FDROID_REPO" status --porcelain || true)"
if [[ -n "$dirty" ]]; then
  echo "Mirror has changes; committing."
  git -C "$FDROID_REPO" add -A
  if ! git -C "$FDROID_REPO" diff --cached --quiet; then
    git -C "$FDROID_REPO" commit -m "sync: BeeMage ${ver} (F-Droid mirror)"
  fi
fi

# Tag
if git -C "$FDROID_REPO" rev-parse "$tag" >/dev/null 2>&1; then
  die "Tag already exists in mirror: $tag"
fi

git -C "$FDROID_REPO" tag -a "$tag" -m "BeeMage ${ver} (F-Droid mirror)"

# Push
git -C "$FDROID_REPO" push origin HEAD
git -C "$FDROID_REPO" push origin "$tag"

echo "OK: mirror tagged and pushed: $tag"
