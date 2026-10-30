#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v xcodebuild >/dev/null || { echo 'Xcode/macOS krävs. Komplett projekt: apps/ios/Hemstyrning.xcodeproj' >&2; exit 1; }
xcodebuild -project apps/ios/Hemstyrning.xcodeproj -scheme Hemstyrning -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build
