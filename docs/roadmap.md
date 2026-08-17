# Roadmap

Unlike the other files in this directory, this one is **not** a description of
current behavior — it's a running list of planned-but-unbuilt future work,
shared across kaori-app (mobile) and kaori-desktop. Update it when a new phase
is decided on, and move an entry out (or mark it done and let the reference
docs describe it) once it actually ships.

Some entries here are partly shipped — where that's true the entry says so and
describes only what's left.

## Planned phases

### Cloud sync

Real multi-device sync for notes/tasks/routines/folders/profile. Both apps
already have a "cloud — synced" row in Settings, but it's a decorative
placeholder today — a `ToggleSwitch` hardcoded to the "on" visual state with no
`onValueChange`/backend behind it (kaori-app's `SettingSheet`, kaori-desktop's
`SettingsSection.tsx`). Still not yet designed in detail (protocol, storage
layout, migration path off AsyncStorage/SQLite) — but the direction is decided,
below. Tech stack for the sync service specifically is still open for
reconsideration; everything else here is settled.

**Deployment.** Self-hosted on the mini PC (Beelink SER5 MAX, Debian) —
same box and same patterns as the `calimali` project: Docker on the `homelab`
network, behind the existing Nginx reverse proxy, deployed via GitHub Actions
→ GHCR → self-hosted runner. Reachable only over Tailscale/LAN — **no public
ingress**, since this is single-user (see below) and offline-first means a
dropped tailnet just pauses sync rather than breaking the app. Cloud storage
(e.g. Backblaze B2) is offsite-backup/DR target only, not the primary.

**Single user, forever.** No multi-tenant schema, no signup flow, no OIDC.
A `user_id` column stays on every row as cheap future-proofing, but nothing
is built around it. Auth follows the calimali pattern: single configured
username/password, `POST /auth/login` returns a JWT, global auth policy on
every other route.

**End-to-end encryption: yes.** Content is encrypted client-side before it
ever reaches the server; the server stores and relays ciphertext blobs only
(it assigns sequence numbers and serves "changes since cursor" without ever
decrypting). Practical consequence: the server can't merge or search content
— all merge logic runs client-side. Key handling: passphrase → Argon2id →
symmetric key (XChaCha20-Poly1305), cached in the OS keychain per device.
The passphrase/recovery key must be escrowed offline (paper/safe/password
manager) — losing it means unrecoverable data loss, independent of any
backup. Multi-device key pairing (QR-code wrapped-key handoff, à la
Signal/WhatsApp) is a nice-to-have for later, not phase one.

**Sync model.** Offline-first: local storage stays the source of truth for
the UI, sync is a background reconciler with a client-side outbox queue.
Server holds an append-only **oplog** (encrypted envelopes, server-assigned
monotonic `seq`, ~90-day retention) — devices track a `lastSyncedCursor` and
pull deltas, not full state. Deletes are tombstoned in the log, not inferred
from absence. Conflict handling is per-record, not per-device (no
Steam-Cloud-style "pick one" prompt on every reconnect):

- `Note` text: fork on genuine same-field conflict ("conflicted copy from
  iPhone"), pending the Yjs/CRDT decision below, which would replace this
  with real merging.
- `Task` / `Routine` / `Folder`: field-level merge, never forked (forking a
  Task or Folder produces duplicates/orphans, not a useful outcome).
  `Routine.completions` merges per date key naturally.
- Derived fields (e.g. `Folder.count`) are never synced — recomputed locally
  from synced children.

**Interaction with the canvas.** The shipped canvas does _not_ use Yjs — it
stores a plain scene JSON per canvas with a snapshot-based undo, so a synced
canvas would fork on conflict like `Note.text` rather than merge. If real
merging is wanted for either, adopting Yjs would be one decision covering both;
see [canvas.md](canvas.md) for the current model.

**Groundwork, independent of the above:** finish migrating kaori-app off
hand-mirrored types onto `kaori-core` as the single source of truth (see
the note at the top of `kaori-core/src/types.ts`); add real `updatedAt` +
`deletedAt` tombstones to the shared types (today only `createdAt` exists on
most); stable client-generated UUIDs; a per-install device id.

**Backups (separate from sync, but related).** 3-2-1: mini PC disk +
external drive on the mini PC + offsite (e.g. restic → B2, encrypted).
Postgres via pgBackRest/wal-g with WAL archiving for point-in-time recovery.
Automated weekly restore-drill (restore into a scratch container, sanity
check, alert on failure) — the untested-backup problem is the main risk to
close here.

### Canvas on mobile

**Shipped.** See [canvas.md](canvas.md) for how it works on both platforms.

What was predicted here held up: the scene model, reducer, geometry and layout
all came from `kaori-core` unchanged, so this was a rendering-and-input job.
kaori-app took the dependency with metro `watchFolders`/`nodeModulesPaths`
wiring, draws with `react-native-svg`, and stores one AsyncStorage key per
document. Text measurement uses a character-width table — generated from the
fonts' own `hmtx` tables by `scripts/gen-font-metrics.mjs` rather than
hand-estimated, since guessed widths desync hit-testing from the glyphs drawn.

Two predictions were wrong and are worth remembering:

- Pan/zoom is _not_ one Reanimated transform that makes node count irrelevant.
  Translating the drawn surface exposes its edges, so it needs overdraw and a
  periodic re-base, and that re-base is a fold between React state and a shared
  value that can slip a frame. See the known-limitation section in canvas.md.
- Worklets still can't call `kaori-core`, but the viewport math did not need
  duplicating: panning accumulates a plain screen-space offset in the worklet
  and every conversion stays on the JS side.

**Left on mobile:** images (needs `expo-image-picker`).

**Still open on desktop too:** export (PNG/SVG), list-row thumbnails, and
duplicate. Curved arrows and binding for plain lines were both raised and
deliberately deferred.

## Keeping this current

This file only needs updating when the plan itself changes (a phase gets
added, scoped, or completed) — not on every commit. See
[CLAUDE.md → Documentation](../CLAUDE.md#documentation) for the docs-update
policy.
