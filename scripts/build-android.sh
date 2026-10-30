#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ANDROID_HOME:=$PWD/.build-tools/android-sdk}"
: "${JAVA_HOME:=$PWD/.build-tools/jdk}"
export ANDROID_HOME JAVA_HOME
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
if ! test -f .build-tools/debug.keystore; then mkdir -p .build-tools; "$JAVA_HOME/bin/keytool" -genkeypair -keystore .build-tools/debug.keystore -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Hemstyrning Debug,O=Development,C=SE"; fi
if ! test -x "$JAVA_HOME/bin/java" || ! test -x .build-tools/gradle/bin/gradle; then echo 'Installera JDK17, Android SDK35 och Gradle8.9. Se docs/INSTALLABLE_APPS.md.' >&2; exit 1; fi
.build-tools/gradle/bin/gradle -p apps/android "${@:-assembleMobileDebug}" --no-daemon
