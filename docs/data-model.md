# Data Model

All types are defined in [src/types/data.ts](../src/types/data.ts). Data is
stored locally via AsyncStorage; there is no backend or remote schema.

## Types

### Note

| Field       | Type                     | Notes                                  |
| ----------- | ------------------------ | -------------------------------------- |
| `id`        | `string`                 | Unique identifier                      |
| `folder`    | `string \| null`         | Owning folder id, or `null` (orphaned) |
| `text`      | `string`                 | Note body                              |
| `time`      | `string`                 | Display time string                    |
| `date`      | `string`                 | Display date string                    |
| `createdAt` | `string`                 | ISO timestamp                          |
| `tags`      | `string[]`               | Tags                                   |
| `pinned`    | `boolean`                | Pinned to top                          |
| `links`     | `Record<string, string>` | Resolved link metadata, keyed by URL   |
| `archived?` | `boolean`                | Present when archived                  |

### Task

| Field         | Type                     | Notes                                      |
| ------------- | ------------------------ | ------------------------------------------ |
| `id`          | `string`                 | Unique identifier                          |
| `folder`      | `string \| null`         | Owning folder id, or `null`                |
| `title`       | `string`                 | Task title                                 |
| `dueDate`     | `string \| null`         | ISO date, or `null` for no due date        |
| `reminderAt?` | `string \| null`         | ISO datetime for the reminder notification |
| `done`        | `boolean`                | Completion state                           |
| `createdAt`   | `string`                 | ISO timestamp                              |
| `pinned`      | `boolean`                | Pinned to top                              |
| `archived?`   | `boolean`                | Present when archived                      |
| `links`       | `Record<string, string>` | Resolved link metadata, keyed by URL       |

### Routine

| Field          | Type                      | Notes                                          |
| -------------- | ------------------------- | ---------------------------------------------- |
| `id`           | `string`                  | Unique identifier                              |
| `folder`       | `string \| null`          | Owning folder id, or `null`                    |
| `title`        | `string`                  | Routine title                                  |
| `daysOfWeek`   | `number[]`                | Recurring weekdays, `0`=Sun..`6`=Sat           |
| `reminderTime` | `string`                  | `'HH:mm'` 24h, date-independent                |
| `active`       | `boolean`                 | Pause/resume; `false` disables notifications   |
| `createdAt`    | `string`                  | ISO timestamp                                  |
| `pinned`       | `boolean`                 | Pinned to top                                  |
| `archived?`    | `boolean`                 | Present when archived                          |
| `completions`  | `Record<string, boolean>` | Per-day "done today" state, keyed `YYYY-MM-DD` |
| `links`        | `Record<string, string>`  | Resolved link metadata, keyed by URL           |

### Folder

| Field       | Type      | Notes                                            |
| ----------- | --------- | ------------------------------------------------ |
| `id`        | `string`  | Unique identifier                                |
| `name`      | `string`  | Folder name                                      |
| `count`     | `number`  | Cached note count                                |
| `color`     | `string`  | Color name or hex                                |
| `updated`   | `string`  | ISO timestamp of last update                     |
| `note`      | `string`  | Folder description                               |
| `createdAt` | `string`  | ISO timestamp                                    |
| `pinned`    | `boolean` | Pinned to top                                    |
| `archived?` | `boolean` | Present when archived                            |
| `order?`    | `number`  | Sort position; backfilled by migration if absent |

### Profile

| Field           | Type     | Notes                          |
| --------------- | -------- | ------------------------------ |
| `name`          | `string` | Display name                   |
| `initial`       | `string` | Avatar initial                 |
| `defaultFolder` | `string` | Folder id new items default to |

### TimeOfDay

Type alias: `'morning' | 'afternoon' | 'evening' | 'night'`.

`src/types/data.ts` also exports empty seed arrays (`SEED_FOLDERS`,
`SEED_NOTES`, `SEED_TASKS`, `SEED_ROUTINES`) used on first launch.

## Storage layer

[src/utils/storage.ts](../src/utils/storage.ts) wraps AsyncStorage with
error-safe helpers: `safeGet`, `safeSet`, `safeMultiGet`, `safeMultiSet`,
`safeMultiRemove`. Actions and migration use these rather than calling
AsyncStorage directly.

### AsyncStorage keys

| Key                             | Contents                                  | Defined in         |
| ------------------------------- | ----------------------------------------- | ------------------ |
| `@kaori_notes`                  | JSON `Note[]`                             | `migration.ts`     |
| `@kaori_folders`                | JSON `Folder[]`                           | `migration.ts`     |
| `@kaori_tasks`                  | JSON `Task[]`                             | `migration.ts`     |
| `@kaori_routines`               | JSON `Routine[]`                          | `migration.ts`     |
| `@kaori_profile`                | JSON `Profile`                            | `migration.ts`     |
| `@kaori_reset_v2`               | Migration flag (`'1'` once run)           | `migration.ts`     |
| `@kaori_notif_registry`         | Map of `taskId → { notifId }` for cancel  | `notifications.ts` |
| `@kaori_routine_notif_registry` | Map of `routineId → notifId[]` for cancel | `notifications.ts` |

## Loading & migration

[src/utils/migration.ts](../src/utils/migration.ts) exposes
`loadInitialData()`, called once by `StoreProvider` on startup. Behavior:

1. **Reset migration** — if `@kaori_reset_v2` is unset, it clears the old
   notes/folders/profile keys and sets the flag (a one-time data reset).
2. **First launch** — if no stored notes exist, it seeds with the empty
   `SEED_*` arrays + `DEFAULT_PROFILE`, persists them, and returns.
3. **Subsequent launches** — parses stored JSON and **backfills `links: {}`**
   on any note/task/routine missing it (older records predate the `links`
   field), and **backfills `completions: {}`** on any routine missing it. The
   profile is merged over `DEFAULT_PROFILE` so new profile fields get defaults.
4. **Folder order backfill** — if any folder lacks `order`, it sorts
   pinned-first (preserving the order users already see) and assigns sequential
   `order` values, then persists.
5. **Parse-error fallback** — on any JSON parse failure it logs a warning and
   returns the seed data rather than crashing.

`@kaori_routines` was added as a purely-additive key — an absent key just
falls back to `SEED_ROUTINES` — so it required no reset-migration step or
version bump, unlike the one-time `@kaori_reset_v2` clear that notes/folders/
profile went through.

`DEFAULT_PROFILE` and the `KEYS` map are exported from this module for reuse by
the action creators.
