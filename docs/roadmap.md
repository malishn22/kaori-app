# Roadmap

Unlike the other files in this directory, this one is **not** a description of
current behavior — it's a running list of planned-but-unbuilt future work,
shared across kaori-app (mobile) and kaori-desktop. Update it when a new phase
is decided on, and move an entry out (or mark it done and let the reference
docs describe it) once it actually ships.

## Planned phases

### Cloud sync

Real multi-device sync for notes/tasks/routines/folders/profile. Both apps
already have a "cloud — synced" row in Settings, but it's a decorative
placeholder today — a `ToggleSwitch` hardcoded to the "on" visual state with no
`onValueChange`/backend behind it (kaori-app's `SettingSheet`, kaori-desktop's
`SettingsSection.tsx`). Not yet designed: backend choice, conflict resolution,
auth, and how it interacts with each app's local-first storage layer
(AsyncStorage on mobile, SQLite via `@tauri-apps/plugin-sql` on desktop).

### Excalidraw-style drawing/whiteboard integration

A freeform drawing canvas (infinite canvas, shapes, freehand strokes — in the
spirit of Excalidraw), not yet designed. Open questions once this phase
starts: whether it's a new top-level content type alongside Note/Task/Routine
(its own `kaori-core` type + storage adapter) or an editing mode embedded
inside notes, which drawing/canvas library to use on each platform, and how a
drawing gets previewed in list rows.

## Keeping this current

This file only needs updating when the plan itself changes (a phase gets
added, scoped, or completed) — not on every commit. See
[CLAUDE.md → Documentation](../CLAUDE.md#documentation) for the docs-update
policy.
