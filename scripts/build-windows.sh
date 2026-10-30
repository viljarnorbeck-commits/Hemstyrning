#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../apps/windows"
command -v cargo >/dev/null || { echo 'Rust och Windows MSVC/WebView2-byggmiljö krävs. Kör CI-jobbet windows eller bygg från Windows.' >&2; exit 1; }
npm exec --yes --package @tauri-apps/cli -- tauri build
