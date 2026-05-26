# Architecture

Kaori is an offline-first note & task manager built with Expo Router and React
Native. All state lives in React Context providers and persists to AsyncStorage;
there is no backend.

## Data flow

```
AsyncStorage
   │  loadInitialData()  (src/utils/migration.ts)
   ▼
StoreProvider ──────────► derived hooks ──────► screens & components
 (notes/tasks/folders)    (useActive*, etc.)         │
   ▲                                                  │ user action
   │  action creators (src/providers/actions/)        ▼
   └──────────────────── setState + persist ◄─────────┘
```

State flows down from `StoreProvider`; user interactions call actions which
update state and write back to AsyncStorage. Components rarely read the store
directly — they consume derived [hooks](#hooks-1) instead.

## Provider composition

Providers are composed in [app/\_layout.tsx](../app/_layout.tsx). The actual
nesting order (outermost first):

```
GestureHandlerRootView
  SafeAreaProvider
    SettingsProvider          ← theme tone/accent + app settings
      ThemeVarsRoot           ← injects CSS variables from settings
        StoreProvider         ← all app data
          SettingSheetProvider ← ephemeral settings-sheet UI state
            <Stack />          ← Expo Router screens
```

`StoreProvider` is nested inside `SettingsProvider`/`ThemeVarsRoot` so that
theming is available app-wide and settings load before data renders.

## State management

Three Context providers, each persisting independently to AsyncStorage.

### StoreProvider

[src/providers/StoreProvider.tsx](../src/providers/StoreProvider.tsx) holds all
app data and exposes the CRUD action surface.

**State:** `notes`, `folders`, `tasks`, `profile`, `dataLoaded`.

**Actions** cover notes (`addNote`, `updateNote`, `updateNoteLink`,
`deleteNote`, `archiveNote`), folders (`addFolder`, `pinFolder`, `deleteFolder`,
`updateFolderColor`, `renameFolder`, `archiveFolder`, `reorderFolders`), tasks
(`addTask`, `updateTask`, `toggleTask`, `deleteTask`, `archiveTask`, `pinTask`),
conversion between the two (`convertTaskToNote`, `convertNoteToTask`), and
`updateProfile`. See [features.md](features.md) for what each does behaviorally.

**Action-factory pattern:** the actions are not written inline. They are
produced by factory functions in
[src/providers/actions/](../src/providers/actions/) —
[noteActions.ts](../src/providers/actions/noteActions.ts),
[taskActions.ts](../src/providers/actions/taskActions.ts), and
[folderActions.ts](../src/providers/actions/folderActions.ts). Each factory
receives the relevant state setters and returns a set of action functions, which
`StoreProvider` wires together. Link metadata is resolved through the shared
[resolveLinksFor.ts](../src/providers/actions/resolveLinksFor.ts) helper.

On startup, `StoreProvider` loads data via `loadInitialData()` and reschedules
any active task reminders (see [features.md → Reminders](features.md#reminders--notifications)).

### SettingsProvider

[src/providers/SettingsProvider.tsx](../src/providers/SettingsProvider.tsx)
holds `settings: { tone, accent, hapticOnSave, notificationsEnabled }` and
exposes `setSetting(key, value)`, which updates and persists in one call.

### SettingSheetProvider

[src/providers/SettingSheetProvider.tsx](../src/providers/SettingSheetProvider.tsx)
holds ephemeral UI state: `openSheet` (`'tone' | 'accent' | 'folder' | null`)
and `setOpenSheet`. Not persisted.

## Navigation

Expo Router file-based routing under [app/](../app/). Screens include the
`(tabs)` group, plus `note/`, `task/`, `folder/` create & edit screens,
`archived.tsx`, and `profile.tsx`.

The bottom tabs use a **custom** [TabBar.tsx](../src/components/ui/layout/TabBar.tsx)
(replacing the default Expo Router tab bar): three tabs — Today, Tasks,
Projects. The settings screen is registered but hidden from the bar via
`href: null`.

> **Gotcha:** the tab list is hardcoded in `TabBar.tsx`, so adding a tab
> requires updating **both** the `app/(tabs)/_layout.tsx` registration and the
> `tabs` array in `TabBar.tsx`. See [CLAUDE.md](../CLAUDE.md) → Navigation.

## Styling & theming

NativeWind v4 (Tailwind for React Native). Theme colors are computed by
`getColors(tone, accent)` in [src/theme/colors.ts](../src/theme/colors.ts)
(4 tones, 5 accents) and injected as CSS variables (`--color-bg`, `--color-ink`,
…) by [themeVars.ts](../src/theme/themeVars.ts) on the `ThemeVarsRoot` view.
Components consume them via `className="bg-theme-bg"` etc., or read typed values
imperatively through the [useTheme](../src/theme/useTheme.ts) hook.

## Hooks

Custom hooks in [src/hooks/](../src/hooks/) derive computed/filtered data from
the store so screens stay thin. See [features.md → Hooks](features.md#hooks)
for the full list.
