#!/usr/bin/env bash
set -euo pipefail

# One-command launch for Kaori via Expo Go on macOS (no USB, no adb). Prints a
# QR code — scan it in Expo Go on the phone.
#
# Run:  ./scripts/run-device-mac.sh          (or  npm run device:mac )
#       ./scripts/run-device-mac.sh --lan    (plain LAN mode instead)
#
# Runs in TUNNEL mode by default, because plain LAN mode does not work on this
# network and never has. Measured 2026-08-17: Metro served the Android bundle
# fine from the Mac (HTTP 200, 12.2 MB), a sweep of all 254 addresses on
# 192.168.1.x found no phone, and watching port 8081 for 100 seconds during a
# QR scan recorded zero inbound connections. Expo Go reports that as
# "java.io.IOException: Failed to download remote update", which reads like a
# server fault but means the request never arrived. The phone and the Mac are
# not on a mutually routable subnet — most likely a guest SSID, a 2.4/5GHz
# split, or client isolation on the router.
#
# The tunnel relays through Expo's servers, so it works regardless of what the
# router is doing, at the cost of a slower first load. `--lan` is kept for the
# day the network is fixed; if it connects, LAN is worth preferring.
#
# Requirements: Expo Go installed on the phone. First tunnel run offers to
# install @expo/ngrok globally — answer yes.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$(dirname "$SCRIPT_DIR")"
CORE="$(dirname "$APP")/kaori-core"

# Default to the tunnel; --lan opts back out.
MODE_ARGS=(--tunnel)
if [[ "${1:-}" == "--lan" ]]; then
  MODE_ARGS=()
fi

AMBER='\033[0;33m'
RESET='\033[0m'
BOLD='\033[1m'

info() { echo -e "${BOLD}==> $*${RESET}"; }
warn() { echo -e "${AMBER}!  $*${RESET}"; }

# ── Tooling ───────────────────────────────────────────────────────────────────
command -v npx >/dev/null || { echo "npx/node not found — install Node." >&2; exit 1; }

# ── Frontend deps ─────────────────────────────────────────────────────────────
# Compare against package-lock.json rather than just checking node_modules
# exists — a present-but-incomplete node_modules silently resolves fine for
# most imports but fails Metro's bundle graph the moment it hits a
# genuinely-missing package.
if [[ ! -d "$APP/node_modules" || "$APP/package-lock.json" -nt "$APP/node_modules" ]]; then
  info "Installing dependencies"
  npm --prefix "$APP" install --silent
fi

# ── Show the LAN address Metro will advertise ─────────────────────────────────
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [[ -z "$LAN_IP" ]]; then
  warn "Couldn't detect a Wi-Fi IP on en0/en1 — check you're connected to Wi-Fi."
  warn "Metro will still print its own connection URL below."
else
  info "This Mac's Wi-Fi address: $LAN_IP"
fi

# ── Build kaori-core ──────────────────────────────────────────────────────────
# Not optional: kaori-core is a `file:` dependency whose entry point is
# dist/index.js, and dist/ is gitignored with nothing tracked in it. Without a
# build there is no dist for Metro to resolve, and the app fails on the import.
# It also means edits to core actually reach the phone on the next run.
info "Building kaori-core"
npm --prefix "$CORE" run build

info "Open Expo Go and scan the QR code below."
if [[ ${#MODE_ARGS[@]} -eq 0 ]]; then
  warn "LAN mode — this has not worked on this network; drop --lan to use the tunnel."
fi

# ── Start Metro ───────────────────────────────────────────────────────────────
cd "$APP"
exec npx expo start ${MODE_ARGS[@]+"${MODE_ARGS[@]}"}
