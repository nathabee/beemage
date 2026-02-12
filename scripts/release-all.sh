#!/usr/bin/env bash
# scripts/release-all.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

die() { echo "ERROR: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

need git
need node
need npm
need zip
need gh
need rsync
need java

[[ -f VERSION ]] || die "VERSION file missing"
ver="$(tr -d ' \t\r\n' < VERSION)"
[[ -n "$ver" ]] || die "VERSION is empty"
tag="v${ver}"

echo "=== release-all ==="
echo "Version: $ver"
echo "Tag:     $tag"
echo

# 0) Guard: refuse unrelated local changes (only allow paths that this script produces)
dirty_outside_allowed="$(
  git status --porcelain |
    awk '{
      p=$2;

      # allow docs publish paths
      if (p ~ /^docs\/demo(\/|$)/) next;
      if (p == "docs/index.html") next;
      if (p ~ /^docs\/assets\/opencv(\/|$)/) next;
      if (p ~ /^docs\/assets\/pipelines(\/|$)/) next;

      # allow release artifacts
      if (p ~ /^(release)(\/|$)/) next;

      # allow app build byproducts
      if (p ~ /^apps\/[^\/]+\/dist(\/|$)/) next;

      # allow android-web copying into wrapper assets (should be gitignored, but tolerate)
      if (p ~ /^apps\/android-native\/app\/src\/main\/assets(\/|$)/) next;

      print;
    }'
)"
[[ -z "$dirty_outside_allowed" ]] || {
  echo "Unrelated local changes detected:"
  echo "$dirty_outside_allowed"
  die "Commit/stash these first, then rerun."
}

# 1) Build extension zip
echo "== 1) Build extension zip =="
./apps/extension/scripts/build-extension-zip.sh

# 2) Build demo zip
echo
echo "== 2) Build demo zip =="
./apps/demo/scripts/build-demo-zip.sh

# 3) Build Android web bundle + copy into android-native assets
echo
echo "== 3) Build Android web bundle (and sync into wrapper assets) =="
./apps/android-web/scripts/build-android-web.sh

# 4) Build Android native artifacts (APK + AAB) into /release
echo
echo "== 4) Build Android native artifacts (APK + AAB) =="
./apps/android-native/scripts/build-android-native.sh all release

# 5) Publish demo/dist -> docs/demo
echo
echo "== 5) Publish demo to GitHub Pages (docs/demo) =="

DEMO_DIST="${ROOT_DIR}/apps/demo/dist"
DOCS_DEMO="${ROOT_DIR}/docs/demo"
ASSETS_SRC="${ROOT_DIR}/assets"
ASSETS_DST="${ROOT_DIR}/docs/assets"

[[ -d "$DEMO_DIST" ]] || die "Missing $DEMO_DIST (demo build failed?)"

mkdir -p "$DOCS_DEMO"
rsync -a --delete --checksum "$DEMO_DIST"/ "$DOCS_DEMO"/

mkdir -p "$ASSETS_DST/opencv" "$ASSETS_DST/pipelines"

if [[ -d "$ASSETS_SRC/opencv" ]]; then
  rsync -a --delete --checksum "$ASSETS_SRC/opencv"/ "$ASSETS_DST/opencv"/
fi

if [[ -d "$ASSETS_SRC/pipelines" ]]; then
  rsync -a --delete --checksum "$ASSETS_SRC/pipelines"/ "$ASSETS_DST/pipelines"/
fi

echo "Demo published to $DOCS_DEMO (diff-aware)"

# 6) Commit + push docs demo (only if changed)
echo
echo "== 6) Commit + push docs demo =="

git add -f -A -- docs/demo docs/index.html docs/assets/opencv docs/assets/pipelines 2>/dev/null || true

if ! git diff --cached --quiet; then
  git commit -m "docs(demo): publish demo ${ver}"
  git push origin HEAD
  echo "Committed + pushed docs demo for ${ver}"
else
  echo "No docs changes to commit."
fi

# 7) Create/ensure GitHub release (optional)
echo
echo "== 7) Create/ensure GitHub release (optional) =="
release_choice="${BCT_RELEASE_CREATE:-}"
RELEASE_READY="no"

if gh release view "$tag" >/dev/null 2>&1; then
  RELEASE_READY="yes"
fi

if [[ -z "$release_choice" ]]; then
  read -r -p "Create/ensure GitHub release ${tag}? [Y/n] " release_choice
fi

case "${release_choice,,}" in
  ""|y|yes)
    ./scripts/publish-release.sh
    RELEASE_READY="yes"
    ;;
  *)
    echo "Skipping release creation."
    ;;
esac

# 8) Upload extension zip (optional)
echo
echo "== 8) Upload extension zip (optional) =="
ext_choice="${BCT_EXT_UPLOAD:-}"

if [[ "$RELEASE_READY" != "yes" ]]; then
  echo "No GitHub release available for ${tag}; skipping extension upload."
  ext_choice="no"
fi

if [[ -z "$ext_choice" ]]; then
  read -r -p "Upload extension zip to release ${tag}? [Y/n] " ext_choice
fi

case "${ext_choice,,}" in
  ""|y|yes)
    ./apps/extension/scripts/publish-extension-zip.sh
    ;;
  *)
    echo "Skipping extension upload."
    ;;
esac

# 9) Upload demo zip (optional)
echo
echo "== 9) Upload demo zip (optional) =="
demo_choice="${BCT_DEMO_UPLOAD:-}"

if [[ "$RELEASE_READY" != "yes" ]]; then
  echo "No GitHub release available for ${tag}; skipping demo upload."
  demo_choice="no"
fi

if [[ -z "$demo_choice" ]]; then
  read -r -p "Upload demo zip to release ${tag}? [y/N] " demo_choice
fi

case "${demo_choice,,}" in
  y|yes)
    ./apps/demo/scripts/publish-demo-zip.sh
    ;;
  *)
    echo "Skipping demo upload (default)."
    ;;
esac

# 10) Upload Android artifacts (optional)
echo
echo "== 10) Upload Android APK/AAB (optional) =="
android_choice="${BCT_ANDROID_UPLOAD:-}"

if [[ "$RELEASE_READY" != "yes" ]]; then
  echo "No GitHub release available for ${tag}; skipping Android upload."
  android_choice="no"
fi

if [[ -z "$android_choice" ]]; then
  read -r -p "Upload Android APK/AAB to release ${tag}? [y/N] " android_choice
fi

case "${android_choice,,}" in
  y|yes)
    ./apps/android-native/scripts/publish-android-native-artifacts.sh
    ;;
  *)
    echo "Skipping Android upload (default)."
    ;;
esac

echo
echo "Done for $tag"
