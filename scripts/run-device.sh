#!/usr/bin/env bash
set -euo pipefail

# One-command USB launch for Kaori via Expo Go (no Wi-Fi, no QR scan).
# Runs the same pre-flight checks as calimali-app/scripts/dev.sh (adb health,
# device selection), then hands off to the Expo CLI's own Android-launch
# path (`expo start --android`) — the same thing that fires when you press
# 'a' in the Metro UI. That's what wires `adb reverse` and builds the
# exp:// deep link correctly; hand-building that link ourselves is what
# produced Expo Go's "Something went wrong" screen.
#
# Run from Git Bash:  ./scripts/run-device.sh          (or  npm run device )
#
# Requirements: phone plugged in via USB with Developer Options → USB
# debugging ON (tap "Allow" on the phone the first time), Expo Go installed,
# and the Android SDK platform-tools (adb) available.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$(dirname "$SCRIPT_DIR")"
EXPO_GO_PACKAGE="host.exp.exponent"

AMBER='\033[0;33m'
RESET='\033[0m'
BOLD='\033[1m'
RED='\033[0;31m'

info() { echo -e "${BOLD}==> $*${RESET}"; }
warn() { echo -e "${AMBER}!  $*${RESET}"; }
err()  { echo -e "${RED}✖  $*${RESET}" >&2; }

# ── Tooling ───────────────────────────────────────────────────────────────────
command -v npx >/dev/null || { err "npx/node not found — install Node."; exit 1; }

# Resolve adb: PATH first, then the standard Android SDK location(s).
ADB="$(command -v adb || true)"
if [[ -z "$ADB" ]]; then
  for base in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "${LOCALAPPDATA:-}/Android/Sdk"; do
    [[ -n "$base" ]] || continue
    cand="${base//\\//}/platform-tools/adb.exe"
    if [[ -x "$cand" ]]; then ADB="$cand"; break; fi
  done
fi
[[ -n "$ADB" ]] || { err "adb not found — install the Android SDK platform-tools (ships with Android Studio)."; exit 1; }

# Every adb call goes through this. The adb server can wedge (a sleeping USB
# port, a cable replug, a stale server from an earlier session) and then
# *every* client blocks forever with no output — which looks exactly like the
# script hanging for no reason. Bounding each call turns that into a clear
# error instead. Exit code 124 = timed out.
adb_run() { timeout "$1" "$ADB" "${@:2}"; }

# Nudge a wedged server back to life once, rather than making the user diagnose it.
if ! adb_run 10 start-server >/dev/null 2>&1; then
  warn "adb server is not responding — restarting it."
  timeout 10 "$ADB" kill-server >/dev/null 2>&1 || true
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //F //IM adb.exe >/dev/null 2>&1 || true
  fi
  sleep 1
  adb_run 15 start-server >/dev/null 2>&1 \
    || { err "adb is still unresponsive after a restart. Unplug and replug the phone, then retry."; exit 1; }
fi

# ── Purge stale/ghost emulator adb entries ────────────────────────────────────
# The Expo CLI's --android flag (used below) opens on every device `adb
# devices` reports — it has no way to target a single serial. A stale
# 'emulator-XXXX' entry left behind by a crashed/closed AVD (still tracked by
# the adb server, but with nothing listening on its console port) makes the
# *entire* `expo start --android` launch fail with "could not connect to TCP
# port ...: connection refused", even though the real phone is fine.
# Restarting the adb server forces a fresh device scan, which drops
# genuinely-dead ghosts; a real, running emulator just re-registers instantly.
if adb_run 15 devices 2>/dev/null | tr -d '\r' | grep -q '^emulator-'; then
  warn "Stale emulator adb entry detected — restarting the adb server to clear it."
  timeout 10 "$ADB" kill-server >/dev/null 2>&1 || true
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //F //IM adb.exe >/dev/null 2>&1 || true
  fi
  sleep 1
  adb_run 15 start-server >/dev/null 2>&1 || true
  sleep 1
fi

# ── Select the target phone ───────────────────────────────────────────────────
# Robust to leftover/offline emulators and stale wireless-adb entries: pick the
# one ONLINE physical device (or honor KAORI_DEVICE=<serial>), then pin every
# adb command to it via ANDROID_SERIAL — so a dead 'emulator-xxxx' can't break
# device *selection*, even though it can't stop Expo's own --android launch
# from trying every device (handled by the purge above).
ADB_TABLE="$(adb_run 15 devices 2>/dev/null | tr -d '\r' | tail -n +2 || true)"
ONLINE_SERIALS="$(printf '%s\n' "$ADB_TABLE" | awk '$2=="device"{print $1}')"
if printf '%s\n' "$ADB_TABLE" | awk '$2=="unauthorized"{f=1} END{exit !f}'; then
  err "The phone is plugged in but shows as 'unauthorized'."
  err "Unlock it and tap 'Allow USB debugging' (tick 'Always allow from this computer'), then re-run."
  err "No prompt? Revoke and retry: Developer options → 'Revoke USB debugging authorizations', then replug."
  exit 1
fi

SERIAL="${KAORI_DEVICE:-}"
if [[ -z "$SERIAL" ]]; then
  N_ONLINE="$(printf '%s\n' "$ONLINE_SERIALS" | grep -c . || true)"
  if [[ "$N_ONLINE" -eq 1 ]]; then
    SERIAL="$(printf '%s\n' "$ONLINE_SERIALS" | grep .)"
  elif [[ "$N_ONLINE" -gt 1 ]]; then
    # More than one online — prefer a single physical device over emulators.
    PHYS="$(printf '%s\n' "$ONLINE_SERIALS" | grep -v '^emulator-' || true)"
    [[ "$(printf '%s\n' "$PHYS" | grep -c . || true)" -eq 1 ]] && SERIAL="$(printf '%s\n' "$PHYS" | grep .)"
  fi
fi

if [[ -z "$SERIAL" ]]; then
  err "Couldn't pick a target device. adb currently sees:"
  "$ADB" devices -l >&2 || true
  err "Plug in your phone (USB debugging on, tap Allow), or pick one: KAORI_DEVICE=<serial> ./scripts/run-device.sh"
  exit 1
fi
export ANDROID_SERIAL="$SERIAL"
adb_dev() { adb_run "$1" -s "$SERIAL" "${@:2}"; }
info "Target device: $SERIAL"

# ── Confirm Expo Go is installed ──────────────────────────────────────────────
PKG_LIST=""
PKG_QUERY_RC=0
if ! PKG_LIST="$(adb_dev 30 shell pm list packages 2>/dev/null | tr -d '\r')"; then
  PKG_QUERY_RC=$?
fi
if [[ "$PKG_QUERY_RC" -ne 0 || -z "${PKG_LIST//[[:space:]]/}" ]]; then
  err "Couldn't ask the phone which apps are installed (adb exit $PKG_QUERY_RC)."
  err "Most often the phone dropped its USB authorization mid-run — unlock it and tap"
  err "'Allow USB debugging', or replug the cable, then re-run."
  exit 1
fi
if ! printf '%s\n' "$PKG_LIST" | grep -q "^package:$EXPO_GO_PACKAGE$"; then
  err "Expo Go isn't installed on the phone. Install it from the Play Store, then re-run."
  exit 1
fi

# ── Warn if a genuine emulator is still running alongside the phone ──────────
# If an 'emulator-*' entry survived the purge above, it's a real, live AVD —
# Expo's --android will still try to open Kaori on it too, which can be slow
# or noisy (though it shouldn't hard-fail like a dead one does).
if adb_run 15 devices 2>/dev/null | tr -d '\r' | grep -q '^emulator-.*device$'; then
  warn "An Android emulator is also running — Expo will try to open Kaori on it too."
  warn "Close it first if you only want this to launch on the phone."
fi

# ── Frontend deps ─────────────────────────────────────────────────────────────
# Compare against package-lock.json rather than just checking node_modules
# exists — a present-but-incomplete node_modules (e.g. package.json changed
# without a follow-up install) silently resolves fine for most imports but
# fails Metro's bundle graph the moment it hits a genuinely-missing package,
# which surfaces on the phone as Expo Go's generic "Something went wrong".
if [[ ! -d "$APP/node_modules" || "$APP/package-lock.json" -nt "$APP/node_modules" ]]; then
  info "Installing dependencies"
  npm --prefix "$APP" install --silent
fi

# ── Start Metro and open Kaori in Expo Go on the phone ────────────────────────
# --localhost advertises the dev server as 127.0.0.1 instead of the LAN IP, so
# it works purely over the USB cable (no Wi-Fi, no firewall rules needed).
# --android is exactly the 'a' keyboard shortcut, run automatically: the Expo
# CLI sets up `adb reverse` itself and launches Expo Go with the correct
# exp:// link for the active host mode. Foregrounded (no backgrounding, no
# manual adb intent) so Ctrl+C stops everything cleanly, same as calimali's
# dev.sh does for Metro.
#
# NODE_OPTIONS=--dns-result-order=ipv4first is load-bearing on Windows: Node
# resolves 'localhost' to the IPv6 loopback (::1) here, so Metro binds ONLY
# to ::1 without this. `adb reverse` always forwards to 127.0.0.1 (IPv4) on
# the host side — with a ::1-only Metro, the phone's tunnel points at a port
# nothing is listening on, and Expo Go fails with "Failed to download remote
# update" (or a generic "Something went wrong") even though Metro looks fine
# from the PC itself (curl to 'localhost' happens to also resolve to ::1).
info "Starting Metro and opening Kaori in Expo Go (npx expo start --localhost --android)"
cd "$APP"
export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--dns-result-order=ipv4first"
exec npx expo start --localhost --android
