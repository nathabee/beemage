#!/usr/bin/env bash
set -euo pipefail


echo "This script is called in case release-all.sh failed zip"
echo "Typically after getting the message ERROR: Working tree not clean. Commit/stash first."


# 1) See exactly what’s dirty
git status --porcelain

# 2) Stage and commit all
git add -A
git commit -m "clean tree before release"

# 3) Now the publish script will pass its clean-tree guard
echo "in case error by publishing zip, you need to run :"
echo "./apps/extension/scripts/publish-extension-zip.sh"
echo "./apps/demo/scripts/publish-demo-zip.sh"
echo "./apps/android-native/scripts/publish-android-native-artifacts.sh"
echo 