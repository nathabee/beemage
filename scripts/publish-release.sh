#!/usr/bin/env bash
# scripts/publish-release.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

need git
need gh

[[ -f VERSION ]] || die "VERSION file missing"
ver="$(tr -d ' \t\r\n' < VERSION)"
[[ -n "$ver" ]] || die "VERSION is empty"
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
if git rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1; then
  TAG_SHA="$(git rev-parse "$tag^{commit}")"
  if [[ "$TAG_SHA" != "$HEAD_SHA" ]]; then
    if [[ "$RELEASE_EXISTS" == "yes" ]]; then
      die "Release already exists for $tag and the tag points to a different commit. Bump VERSION for a new release."
    fi
    git tag -f -a "$tag" -m "Release $tag ($HEAD_SHORT)" "$HEAD_SHA"
  fi
else
  git tag -a "$tag" -m "Release $tag ($HEAD_SHORT)" "$HEAD_SHA"
fi

# Push tag (safe force only if no release exists yet)
if [[ "$RELEASE_EXISTS" == "yes" ]]; then
  git push origin "refs/tags/$tag"
else
  git push origin "refs/tags/$tag" --force-with-lease
fi

# Notes via heredoc (avoids fragile $'...' quoting)
NOTES="$(cat <<EOF
BeeMage — Release artifacts

- Version: ${ver}
- Tag: ${tag}
- Commit: ${HEAD_SHORT}

Artifacts (uploaded by release-all or per-app publish scripts):
- beemage-extension-${ver}.zip
- beemage-demo-${ver}.zip (optional)
- beemage-android-${ver}-release.apk/.aab (optional)
EOF
)"

if [[ "$RELEASE_EXISTS" == "yes" ]]; then
  echo "Release exists: ${tag} — not recreating"
else
  gh release create "$tag" --title "$tag" --notes "$NOTES"
  echo "Created release: $tag"
fi
