#!/usr/bin/env bash
# apps/android-native/scripts/publish-android-native-artifacts.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

die() { echo "ERROR: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

need git
need gh

[[ -f VERSION ]] || die "VERSION file missing"
ver="$(tr -d ' \t\r\n' < VERSION)"
tag="v${ver}"

APK="release/beemage-android-${ver}-release.apk"
AAB="release/beemage-android-${ver}-release.aab"

[[ -f "$APK" ]] || die "Missing $APK. Run: ./apps/android-native/scripts/build-android-native.sh apk release"
# AAB is optional if you decide not to ship it sometimes, but for stores it matters.
[[ -f "$AAB" ]] || echo "WARN: Missing $AAB (Google Play wants AAB)."

# keep same policy as your other publish scripts
[[ -z "$(git status --porcelain)" ]] || die "Working tree not clean. Commit/stash first."

gh auth status >/dev/null 2>&1 || die "gh not authenticated. Run: gh auth login"
gh release view "$tag" >/dev/null 2>&1 || die "Release $tag not found. Create it first (publish extension release)."

if [[ -f "$AAB" ]]; then
  gh release upload "$tag" "$APK" "$AAB" --clobber
else
  gh release upload "$tag" "$APK" --clobber
fi

echo "Done: uploaded Android artifacts to release $tag."
