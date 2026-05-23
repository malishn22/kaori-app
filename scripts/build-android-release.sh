#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root (script lives in <repo>/scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [ -t 1 ]; then
  C_BOLD=$'\033[1m'
  C_BLUE=$'\033[34m'
  C_GREEN=$'\033[32m'
  C_RED=$'\033[31m'
  C_DIM=$'\033[2m'
  C_RESET=$'\033[0m'
else
  C_BOLD=""; C_BLUE=""; C_GREEN=""; C_RED=""; C_DIM=""; C_RESET=""
fi

step() {
  printf '\n%s==> Step %s/3: %s%s\n' "${C_BOLD}${C_BLUE}" "$1" "$2" "$C_RESET"
}

fail() {
  printf '%sERROR:%s %s\n' "${C_BOLD}${C_RED}" "$C_RESET" "$1" >&2
  exit 1
}

printf '%sKaori Android release build%s %s(%s)%s\n' \
  "$C_BOLD" "$C_RESET" "$C_DIM" "$(date '+%Y-%m-%d %H:%M:%S')" "$C_RESET"

# --- Step 1: prebuild ---
step 1 "expo prebuild --platform android --clean"
npx expo prebuild --platform android --clean

# --- Step 2: patch gradle.properties (prebuild reset it) ---
step 2 "patch android/gradle.properties (heap 4G / metaspace 1G)"
GRADLE_PROPS="$REPO_ROOT/android/gradle.properties"
TARGET_LINE='org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m'

[ -f "$GRADLE_PROPS" ] || fail "missing $GRADLE_PROPS after prebuild"

# BSD sed (darwin) — replace the jvmargs line in place
sed -i '' -E "s|^org\\.gradle\\.jvmargs=.*|${TARGET_LINE}|" "$GRADLE_PROPS"

if ! grep -qF "$TARGET_LINE" "$GRADLE_PROPS"; then
  fail "gradle.properties patch did not apply — expected line not found after sed"
fi
printf '  %sok%s — %s\n' "$C_GREEN" "$C_RESET" "$TARGET_LINE"

# --- Step 3: gradle assembleRelease ---
step 3 "./gradlew assembleRelease"
cd "$REPO_ROOT/android"
./gradlew assembleRelease

# --- Summary ---
cd "$REPO_ROOT"
APK_DIR="$REPO_ROOT/android/app/build/outputs/apk/release"
APK="$APK_DIR/app-release.apk"

printf '\n%sBUILD SUCCESSFUL%s\n' "${C_BOLD}${C_GREEN}" "$C_RESET"
if [ -f "$APK" ]; then
  ls -lh "$APK" | awk '{printf "  %s  (%s)\n", $NF, $5}'
else
  shopt -s nullglob
  found=("$APK_DIR"/app-release*.apk)
  if [ ${#found[@]} -gt 0 ]; then
    for f in "${found[@]}"; do ls -lh "$f" | awk '{printf "  %s  (%s)\n", $NF, $5}'; done
  else
    printf '  %s(no APK found under %s)%s\n' "$C_DIM" "$APK_DIR" "$C_RESET"
  fi
fi
