#!/usr/bin/env bash
# apps/demo/scripts/build-demo.sh
set -euo pipefail

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # apps/demo
cd "$DEMO_DIR"

npm ci
npm run build
