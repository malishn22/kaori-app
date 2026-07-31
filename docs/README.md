# Kaori Documentation

Reference documentation for the Kaori codebase — the internals behind the
note & task manager. For setup, build, and run instructions, see the
[root README](../README.md). For agent/contributor conventions and commands,
see [CLAUDE.md](../CLAUDE.md).

## Contents

- **[architecture.md](architecture.md)** — the big picture: provider
  composition, state management, navigation, and the theming/styling system.
- **[data-model.md](data-model.md)** — the `Note` / `Task` / `Routine` /
  `Folder` / `Profile` types, the storage layer, and the migration/load logic.
- **[features.md](features.md)** — each user-facing feature (notes, tasks,
  routines, reminders, folders, theming) and where its code lives.
- **[conventions.md](conventions.md)** — coding conventions, the quality gate,
  and build/release workflows.

## Keeping these docs current

These files are **reference material describing current behavior**, not a
changelog. The rule for keeping them in sync after a feature or behavior change
lives in [CLAUDE.md → Documentation](../CLAUDE.md#documentation): docs are
updated only when explicitly confirmed, never automatically.
