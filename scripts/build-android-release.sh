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

# --- Preflight: locate the JDK and Android SDK ---
# Gradle needs both, and on macOS neither is on PATH by default even with Android Studio
# installed: it ships its own JDK *inside* the .app bundle and never exports ANDROID_HOME.
# Resolving them here turns two opaque failures ("Unable to locate a Java Runtime", "SDK
# location not found") into a build that just runs.
printf '\n%s==> Preflight: toolchain%s\n' "${C_BOLD}${C_BLUE}" "$C_RESET"

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "${JAVA_HOME:-}/bin/java" ]; then
  for candidate in \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "$HOME/Applications/Android Studio.app/Contents/jbr/Contents/Home"; do
    if [ -x "$candidate/bin/java" ]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi
if [ -z "${JAVA_HOME:-}" ] || [ ! -x "${JAVA_HOME:-}/bin/java" ]; then
  if [ -x /usr/libexec/java_home ] && /usr/libexec/java_home >/dev/null 2>&1; then
    export JAVA_HOME="$(/usr/libexec/java_home)"
  fi
fi
if [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ]; then
  export PATH="$JAVA_HOME/bin:$PATH"
  printf '  %sok%s — JDK %s\n' "$C_GREEN" "$C_RESET" \
    "$("$JAVA_HOME/bin/java" -version 2>&1 | head -1 | sed 's/.*version "\([^"]*\)".*/\1/')"
elif command -v java >/dev/null 2>&1; then
  # Already on PATH (typical on Windows/Linux) — Gradle will find it on its own.
  printf '  %sok%s — java on PATH\n' "$C_GREEN" "$C_RESET"
else
  fail "no JDK found — install Android Studio (it bundles one), or set JAVA_HOME"
fi

if [ -z "${ANDROID_HOME:-}" ]; then
  # Every one of these needs a :- default — the script runs under `set -u`, and
  # LOCALAPPDATA in particular is only set on Windows.
  for candidate in "${ANDROID_SDK_ROOT:-}" "$HOME/Library/Android/sdk" "$HOME/Android/Sdk" "${LOCALAPPDATA:-}/Android/Sdk"; do
    if [ -n "$candidate" ] && [ -d "$candidate/platform-tools" ]; then
      export ANDROID_HOME="$candidate"
      break
    fi
  done
fi
[ -n "${ANDROID_HOME:-}" ] || fail "Android SDK not found — install it via Android Studio, or set ANDROID_HOME"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
printf '  %sok%s — SDK %s\n' "$C_GREEN" "$C_RESET" "$ANDROID_HOME"

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
