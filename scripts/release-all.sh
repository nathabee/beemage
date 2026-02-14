#!/usr/bin/env bash
# scripts/release-all.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

die() { echo "ERROR: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

# Run a command as a labeled step and fail explicitly if it fails.
run() {
  local label="$1"; shift
  echo
  echo "== ${label} =="
  "$@" || die "${label} failed: $*"
}

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

# Model B: we create the git tag at the END.
RELEASE_WANTED="no"
EXT_UPLOAD="no"
DEMO_UPLOAD="no"
ANDROID_UPLOAD="no"
RELEASE_READY="no"

echo "=== release-all ==="
echo "Version: $ver"
echo "Tag:     $tag"
echo

# 0) Prepare release commit (interactive if needed). Hard-fail on any error.
run "0) Prepare release commit" ./scripts/prepare-release-commit.sh

# 0.1) Guard: refuse unrelated local changes (only allow paths that this script produces)
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
run "1) Build extension zip" ./apps/extension/scripts/build-extension-zip.sh

# 2) Build demo zip
run "2) Build demo zip" ./apps/demo/scripts/build-demo-zip.sh

# 3) Build Android web bundle + copy into android-native assets
run "3) Build Android web bundle (and sync into wrapper assets)" \
  ./apps/android-web/scripts/build-android-web.sh

# 4) Build Android native artifacts (APK + AAB) into /release
run "4) Build Android native artifacts (APK + AAB)" \
  ./apps/android-native/scripts/build-android-native.sh all release

# 4.1) Android preflight checks (version/sdk + signing if configured)
# Default: strict (fail the release-all if checks fail)
# Set BCT_ANDROID_CHECK_STRICT=0 to warn-only and continue.
echo
echo "== 4.1) Android preflight checks =="

ANDROID_CHECK_STRICT="${BCT_ANDROID_CHECK_STRICT:-1}"

run_android_check() {
  if [[ -f "./apps/android-native/keystore.properties" ]]; then
    ./apps/android-native/scripts/check.sh --require-signing
  else
    ./apps/android-native/scripts/check.sh
  fi
}

if ! run_android_check; then
  if [[ "$ANDROID_CHECK_STRICT" == "1" ]]; then
    die "Android preflight checks failed."
  else
    echo "WARN: Android preflight checks failed — continuing because BCT_ANDROID_CHECK_STRICT=0"
  fi
fi

# 5) Publish demo/dist -> docs/demo
echo
echo "== 5) Publish demo to GitHub Pages (docs/demo) =="

DEMO_DIST="${ROOT_DIR}/apps/demo/dist"
DOCS_DEMO="${ROOT_DIR}/docs/demo"
ASSETS_SRC="${ROOT_DIR}/assets"
ASSETS_DST="${ROOT_DIR}/docs/assets"

[[ -d "$DEMO_DIST" ]] || die "Missing $DEMO_DIST (demo build failed?)"

mkdir -p "$DOCS_DEMO"
run "5.1) rsync demo dist -> docs/demo" rsync -a --delete --checksum "$DEMO_DIST"/ "$DOCS_DEMO"/

mkdir -p "$ASSETS_DST/opencv" "$ASSETS_DST/pipelines"

if [[ -d "$ASSETS_SRC/opencv" ]]; then
  run "5.2) rsync assets/opencv -> docs/assets/opencv" \
    rsync -a --delete --checksum "$ASSETS_SRC/opencv"/ "$ASSETS_DST/opencv"/
fi

if [[ -d "$ASSETS_SRC/pipelines" ]]; then
  run "5.3) rsync assets/pipelines -> docs/assets/pipelines" \
    rsync -a --delete --checksum "$ASSETS_SRC/pipelines"/ "$ASSETS_DST/pipelines"/
fi

echo "Demo published to $DOCS_DEMO (diff-aware)"

# 6) Commit + push docs demo (only if changed)
echo
echo "== 6) Commit + push docs demo =="

# Intentionally non-fatal: paths may be missing on some machines.
git add -f -A -- docs/demo docs/index.html docs/assets/opencv docs/assets/pipelines 2>/dev/null || true

if ! git diff --cached --quiet; then
  run "6.1) Commit docs demo" git commit -m "docs(demo): publish demo ${ver}"
  run "6.2) Push docs demo" git push origin HEAD
  echo "Committed + pushed docs demo for ${ver}"
else
  echo "No docs changes to commit."
fi

# 7) GitHub release? (Model B: created after tagging at the end)
echo
echo "== 7) GitHub release (created after tagging) =="

release_choice="${BCT_RELEASE_CREATE:-}"
if [[ -z "$release_choice" ]]; then
  read -r -p "Create/ensure GitHub release ${tag} after tagging? [Y/n] " release_choice
fi

case "${release_choice,,}" in
  ""|y|yes)
    RELEASE_WANTED="yes"
    ;;
  *)
    echo "Skipping GitHub release."
    RELEASE_WANTED="no"
    ;;
esac

# 8) Extension upload choice (performed after release creation)
echo
echo "== 8) Upload extension zip (after release) =="

ext_choice="${BCT_EXT_UPLOAD:-}"
if [[ -z "$ext_choice" ]]; then
  read -r -p "Upload extension zip to release ${tag}? [Y/n] " ext_choice
fi
case "${ext_choice,,}" in
  ""|y|yes) EXT_UPLOAD="yes" ;;
  *) EXT_UPLOAD="no" ;;
esac

# 9) Demo upload choice (performed after release creation)
echo
echo "== 9) Upload demo zip (after release) =="

demo_choice="${BCT_DEMO_UPLOAD:-}"
if [[ -z "$demo_choice" ]]; then
  read -r -p "Upload demo zip to release ${tag}? [y/N] " demo_choice
fi
case "${demo_choice,,}" in
  y|yes) DEMO_UPLOAD="yes" ;;
  *) DEMO_UPLOAD="no" ;;
esac

# 10) Android upload choice (performed after release creation)
echo
echo "== 10) Upload Android APK/AAB (after release) =="

android_choice="${BCT_ANDROID_UPLOAD:-}"
if [[ -z "$android_choice" ]]; then
  read -r -p "Upload Android APK/AAB to release ${tag}? [y/N] " android_choice
fi
case "${android_choice,,}" in
  y|yes) ANDROID_UPLOAD="yes" ;;
  *) ANDROID_UPLOAD="no" ;;
esac

# 10.5) Sync F-Droid mirror repository (optional, before VERSION bump)
echo
echo "== 10.5) Sync F-Droid mirror repository (optional) =="

FDROID_SYNC="${BCT_FDROID_SYNC:-1}"
FDROID_REPO="${BCT_FDROID_REPO:-${ROOT_DIR}/../beemage-fdroid}"

if [[ "$FDROID_SYNC" == "1" ]]; then
  if [[ -d "$FDROID_REPO/.git" ]]; then
    run "10.5.1) synchronise-fdroid.sh" ./scripts/synchronise-fdroid.sh "$FDROID_REPO"
    run "10.5.2) tag-fdroid-mirror.sh" ./scripts/tag-fdroid-mirror.sh "$FDROID_REPO"
  else
    echo "WARN: F-Droid mirror repo not found at: $FDROID_REPO"
    echo "      Set BCT_FDROID_REPO or clone beemage-fdroid next to beemage."
  fi
else
  echo "Skipping F-Droid mirror sync because BCT_FDROID_SYNC=0"
fi

# 10.6) Tag + create GitHub release + upload assets (Model B)
echo
echo "== 10.6) Tag + create GitHub release + upload assets =="

if [[ "${RELEASE_WANTED}" == "yes" ]]; then
  # Tag must point to final HEAD
  if git rev-parse "$tag" >/dev/null 2>&1; then
    die "Tag already exists: ${tag}. Delete it first if you want to retag."
  fi

  run "10.6.1) tag-version.sh" ./scripts/tag-version.sh

  # publish-release.sh must NOT tag anymore; it should only create/ensure the GitHub Release
  run "10.6.2) publish-release.sh" ./scripts/publish-release.sh

  if [[ "${EXT_UPLOAD}" == "yes" ]]; then
    run "10.6.3) publish-extension-zip.sh" ./apps/extension/scripts/publish-extension-zip.sh
  else
    echo "Skipping extension upload."
  fi

  if [[ "${DEMO_UPLOAD}" == "yes" ]]; then
    run "10.6.4) publish-demo-zip.sh" ./apps/demo/scripts/publish-demo-zip.sh
  else
    echo "Skipping demo upload."
  fi

  if [[ "${ANDROID_UPLOAD}" == "yes" ]]; then
    run "10.6.5) publish-android-native-artifacts.sh" \
      ./apps/android-native/scripts/publish-android-native-artifacts.sh
  else
    echo "Skipping Android upload."
  fi

  RELEASE_READY="yes"
  echo "Done for $tag"
else
  RELEASE_READY="no"
  echo "Skipping tag/release/uploads because release was not requested."
fi

# 11) Optional: bump VERSION after a successful *published* release
# Only offer bump if a GitHub release exists/was created (RELEASE_READY=yes).
echo
echo "== 11) Bump VERSION (optional) =="

if [[ "${RELEASE_READY:-no}" != "yes" ]]; then
  echo "Skipping VERSION bump (no GitHub release for ${tag})."
else
  bump_choice="${BCT_BUMP_AFTER_RELEASE:-}"

  if [[ -z "$bump_choice" ]]; then
    read -r -p "Bump VERSION to next patch now (recommended after publishing)? [y/N] " bump_choice
  fi

  case "${bump_choice,,}" in
    y|yes)
      run "11.1) bump-version.sh patch" ./scripts/bump-version.sh patch
      echo
      echo "VERSION bumped and staged."
      echo "Next: update docs/version.md for the new epic, then commit when ready."
      ;;
    *)
      echo "Skipping VERSION bump."
      ;;
  esac
fi
