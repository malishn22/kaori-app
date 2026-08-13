#!/usr/bin/env bash
set -euo pipefail

# One-command Wi-Fi launch for Kaori via Expo Go on macOS (no USB, no adb).
# Starts Metro in the Expo CLI's default LAN mode, which prints a QR code
# and an exp://<lan-ip>:8081 URL — scan it (or open it) in Expo Go on a
# phone connected to the same Wi-Fi network as this Mac.
#
# Run:  ./scripts/run-device-mac.sh          (or  npm run device:mac )
#
# Requirements: phone and Mac on the same Wi-Fi network, Expo Go installed
# on the phone. If your network isolates devices from each other (common on
# guest Wi-Fi or some routers), LAN mode won't connect — use
# `npx expo start --tunnel` instead.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$(dirname "$SCRIPT_DIR")"

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

info "Make sure your phone is on the same Wi-Fi network, then open Expo Go and"
info "scan the QR code Metro prints below."

# ── Start Metro in default LAN mode ───────────────────────────────────────────
cd "$APP"
exec npx expo start
