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
  printf '\n%s==> Step %s/4: %s%s\n' "${C_BOLD}${C_BLUE}" "$1" "$2" "$C_RESET"
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

# Portable in-place edit (BSD sed on macOS, GNU sed on Linux/Windows Git Bash both
# accept an attached backup suffix; a bare `-i ''` only works on BSD sed).
sed -i.bak -E "s|^org\\.gradle\\.jvmargs=.*|${TARGET_LINE}|" "$GRADLE_PROPS"
rm -f "$GRADLE_PROPS.bak"

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
shopt -s nullglob
found=("$APK_DIR"/app-release*.apk)
if [ -f "$APK" ]; then
  ls -lh "$APK" | awk '{printf "  %s  (%s)\n", $NF, $5}'
elif [ ${#found[@]} -gt 0 ]; then
  for f in "${found[@]}"; do ls -lh "$f" | awk '{printf "  %s  (%s)\n", $NF, $5}'; done
else
  printf '  %s(no APK found under %s)%s\n' "$C_DIM" "$APK_DIR" "$C_RESET"
fi

# --- Step 4: reveal output in Finder/Explorer ---
step 4 "reveal output"
REVEAL_TARGET=""
if [ -f "$APK" ]; then
  REVEAL_TARGET="$APK"
elif [ ${#found[@]} -gt 0 ]; then
  REVEAL_TARGET="${found[0]}"
fi

if command -v open >/dev/null 2>&1; then
  # macOS
  if [ -n "$REVEAL_TARGET" ]; then
    open -R "$REVEAL_TARGET"
    printf '  %sok%s — revealed in Finder\n' "$C_GREEN" "$C_RESET"
  elif open "$APK_DIR" 2>/dev/null; then
    printf '  %sok%s — opened %s\n' "$C_GREEN" "$C_RESET" "$APK_DIR"
  else
    printf '  %s(nothing to reveal)%s\n' "$C_DIM" "$C_RESET"
  fi
elif command -v explorer.exe >/dev/null 2>&1; then
  # Windows (Git Bash / MSYS) — `explorer.exe /select,<path>` wants a Windows-style
  # path; use `//select,` so Git Bash doesn't mangle the leading slash into a path.
  if [ -n "$REVEAL_TARGET" ]; then
    explorer.exe "//select,$(cygpath -w "$REVEAL_TARGET")" || true
    printf '  %sok%s — revealed in Explorer\n' "$C_GREEN" "$C_RESET"
  else
    explorer.exe "$(cygpath -w "$APK_DIR")" || true
    printf '  %sok%s — opened %s\n' "$C_GREEN" "$C_RESET" "$APK_DIR"
  fi
else
  printf '  %sskip%s — no `open`/`explorer.exe` available\n' "$C_DIM" "$C_RESET"
fi
