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

# Clean tree guard (release should represent committed state)
[[ -z "$(git status --porcelain)" ]] || die "Working tree not clean. Commit/stash first."
gh auth status >/dev/null 2>&1 || die "gh not authenticated. Run: gh auth login"

# Model B: tag must already exist and must point to HEAD.
HEAD_SHA="$(git rev-parse HEAD)"
HEAD_SHORT="$(git rev-parse --short HEAD)"

if ! git rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1; then
  die "Missing git tag $tag. Model B requires tagging first (release-all step 10.6.1)."
fi

TAG_SHA="$(git rev-parse "$tag^{commit}")"
if [[ "$TAG_SHA" != "$HEAD_SHA" ]]; then
  die "Tag $tag does not point to HEAD.
Tag:  $TAG_SHA
HEAD: $HEAD_SHA
Refusing to create/update release. Fix by deleting/recreating the tag (Model B tags final HEAD)."
fi

RELEASE_EXISTS="no"
if gh release view "$tag" >/dev/null 2>&1; then
  RELEASE_EXISTS="yes"
fi

# Notes via heredoc (avoids fragile quoting)
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
  echo "https://github.com/nathabee/beemage/releases/tag/${tag}"
else
  gh release create "$tag" --title "$tag" --notes "$NOTES"
  echo "Created release: $tag"
fi
