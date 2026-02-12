#!/usr/bin/env bash
# scripts/publish-release.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

die() { echo "ERROR: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

need git
need gh

[[ -f VERSION ]] || die "VERSION file missing"
ver="$(tr -d ' \t\r\n' < VERSION)"
tag="v${ver}"

# Clean tree guard (tag should represent committed state)
[[ -z "$(git status --porcelain)" ]] || die "Working tree not clean. Commit/stash first."
gh auth status >/dev/null 2>&1 || die "gh not authenticated. Run: gh auth login"

HEAD_SHA="$(git rev-parse HEAD)"
HEAD_SHORT="$(git rev-parse --short HEAD)"

RELEASE_EXISTS="no"
if gh release view "$tag" >/dev/null 2>&1; then
  RELEASE_EXISTS="yes"
fi

# Ensure tag points to HEAD
if git rev-parse "$tag" >/dev/null 2>&1; then
  TAG_SHA="$(git rev-parse "$tag^{commit}")"
  if [[ "$TAG_SHA" != "$HEAD_SHA" ]]; then
    if [[ "$RELEASE_EXISTS" == "yes" ]]; then
      die "Release already exists for $tag and tag points to a different commit. Bump version for a new release."
    fi
    git tag -f -a "$tag" -m "Release $tag ($HEAD_SHORT)" HEAD
  fi
else
  git tag -a "$tag" -m "Release $tag ($HEAD_SHORT)" HEAD
fi

# Push tag (safe force only if no release exists yet)
if [[ "$RELEASE_EXISTS" == "yes" ]]; then
  git push origin "$tag"
else
  git push origin "$tag" --force-with-lease
fi

# NOTES=$'BeeMage — Release artifacts\n\n'"- Version: ${ver}"$'\n'"- Tag: ${tag}"$'\n'"- Commit: ${HEAD_SHORT}"$'\n\n'"Artifacts (uploaded by release-all or per-app publish scripts):\n- beemage-extension-${ver}.zip\n- beemage-demo-${ver}.zip (optional)\n- beemage-android-${ver}-release.apk/.aab (optional)\n'
NOTES="$'BeeMage — Release artifacts\n\n'- Version: ${ver}$'\n'- Tag: ${tag}$'\n'- Commit: ${HEAD_SHORT}$'\n\n'Artifacts (uploaded by release-all or per-app publish scripts):\n- beemage-extension-${ver}.zip\n- beemage-demo-${ver}.zip (optional)\n- beemage-android-${ver}-release.apk/.aab (optional)\n'"
 

if [[ "$RELEASE_EXISTS" == "yes" ]]; then
  echo "Release exists: $tag (not recreating)"
else
  gh release create "$tag" --title "$tag" --notes "$NOTES"
  echo "Created release: $tag"
fi
