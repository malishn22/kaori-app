# Kaori — Codebase Guide

## Dev Commands

```bash
npm run device:mac   # Metro + QR for Expo Go. Runs in TUNNEL mode: plain LAN
                     # does not work on this network. Builds kaori-core first,
                     # which is required — core's entry is dist/ and dist/ is
                     # gitignored. Pass --lan to opt out.
npm start            # Start Expo dev server (scan QR with Expo Go)
npm run ios          # Build & run on iOS simulator
npm run android      # Build & run on Android emulator/device
npm run web          # Start web preview (limited support)
```

## Quality Checks

**Always run `npm run check` before declaring any task complete.** It runs typecheck + lint + format check and must exit 0.

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run lint:fix       # eslint . --fix
npm run format         # prettier --write .
npm run format:check   # prettier --check .
npm run check          # composite: typecheck + lint + format:check
```

ESLint uses `eslint-config-expo/flat` as the base, plus `react-native` and `prettier` plugins. Prettier config is in `.prettierrc.json`. Lint warnings are tolerated; lint errors are not.

## Building for iOS & Android

### Local builds (requires native toolchains)

```bash
# iOS — requires Xcode installed
expo run:ios
expo run:ios --configuration Release    # production build

# Android — requires Android Studio + SDK
expo run:android
expo run:android --variant release      # production build
```

### Android release APK via Gradle

When you need a standalone release APK (e.g. for sideloading or sharing a build), use the wrapper script:

```bash
./scripts/build-android-release.sh
# output: android/app/build/outputs/apk/release/app-release.apk
```

The script runs three steps with labeled section headers: `expo prebuild --platform android --clean`, an in-place patch of `android/gradle.properties` to `-Xmx4096m -XX:MaxMetaspaceSize=1024m`, then `./gradlew assembleRelease`. The patch step is mandatory — prebuild resets the file to the default `-Xmx2048m -XX:MaxMetaspaceSize=512m`, which crashes the Gradle daemon with `OutOfMemoryError: Metaspace` partway through compiling RN modules.

If a previous daemon is hung, run `cd android && ./gradlew --stop` before retrying.

### Cloud builds via EAS (recommended for distribution)

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
eas build --platform all
```

EAS handles signing, certificates, and provisioning. Add `eas.json` to configure build profiles.

### App identifiers

- iOS bundle ID: `com.kaori.app`
- Android package: `com.kaori.app`

## Project Structure

```
app/                    # Expo Router screens (file-based routing)
  (tabs)/               # Tab group: index, tasks, routines, projects, canvas, settings
  note/[id].tsx         # Note detail/editor
  note/new.tsx          # New note
  task/[id].tsx         # Task detail/editor
  task/new.tsx          # New task
  routine/[id].tsx      # Routine detail/editor
  routine/new.tsx       # New routine
  folder/[id].tsx       # Folder detail
  folder/new.tsx        # New folder
  canvas/[id].tsx       # Canvas editor (outside (tabs): the tab bar would cover the surface)
  archived.tsx          # Archived items
  profile.tsx           # User profile

src/
  components/ui/        # All UI components
    cards/              # NoteCard, TaskCard, RoutineCard, FolderCard, SwipeablePinWrapper
    layout/             # TabBar, PageHeader, FAB, EmptyState, PopupMenu
    primitives/         # ThemeText, Input, Chip, FormattedText, Divider
    pickers/            # CalendarPicker, FolderChipSelector, ReminderPicker, WeekdaySelector
    sheets/             # BottomSheet, ColorSwatchPicker
    settings/           # SettingSheet
  components/canvas/    # Drawing surface, toolbar, style panel, text overlay,
                        # selection chrome, generated font metrics
  providers/            # Context API state management
    StoreProvider.tsx   # Main store: notes, tasks, routines, folders, profile
    SettingsProvider.tsx  # Theme tone & accent color
    SettingSheetProvider.tsx  # Bottom sheet open/close state
    CanvasProvider.tsx    # Canvas metadata (scenes load per document)
    actions/            # Action creators: noteActions, taskActions, routineActions, folderActions
  hooks/                # Custom hooks (useActiveNotes, useHapticFeedback, etc.)
  constants/            # Layout, style, color, and option constants
  theme/                # Design tokens, CSS variable injection, useTheme hook
  types/                # TypeScript types (Folder, Note, Task, Routine, Profile)
  utils/                # storage, time, noteFormat, links, notifications, migration

assets/
  icons/index.tsx       # All icon components (SVG-based)
  fonts/                # Custom fonts (Kalam)
  textures/             # Background textures
```

## Architecture

### State Management

Four React Context providers, composed in `app/_layout.tsx`:

- **StoreProvider** — all app data (notes, tasks, routines, folders, profile); persists via AsyncStorage
- **CanvasProvider** — canvas metadata only; scenes are loaded and saved per document by `useCanvasScene`, since re-stringifying every scene on every stroke would stall the JS thread
- **SettingsProvider** — theme tone and accent; persists via AsyncStorage
- **SettingSheetProvider** — ephemeral UI state for the settings bottom sheet

Action creators live in `src/providers/actions/` and are called by the providers. Data is loaded from storage via `src/utils/migration.ts` on app start.

### Navigation

Expo Router (file-based). Tabs defined in `app/(tabs)/_layout.tsx` using a custom `TabBar` component. The custom TabBar hardcodes the tab list in `src/components/ui/layout/TabBar.tsx` — adding a tab requires updating both the `_layout.tsx` registration and the `tabs` array in TabBar.

### Styling

NativeWind v4 (Tailwind for React Native). Theme colors are injected as CSS variables (e.g. `--color-bg`, `--color-ink`) in `src/theme/themeVars.ts` and consumed via `className="bg-theme-bg"` etc. The `useTheme()` hook provides typed color values for imperative styling.

**Styling rule:** Use `className` for all static layout — flexbox, alignment, fixed spacing, overflow, fixed sizing expressible in Tailwind. Reserve `style={{}}` for dynamic/computed values only: theme colors via `useTheme()`, calculated dimensions, animated values, and conditional styling. Never write static layout as an inline `style` object.

## Key Conventions

- Path alias `@/*` resolves to both the project root and `src/` — prefer `@/components/ui`, `@/providers/StoreProvider`, etc.
- UI components are barrel-exported from `src/components/ui/index.ts`; always import from `@/components/ui`
- Icons are in `assets/icons/index.tsx`; import named exports like `{ PenIcon, TaskIcon }`
- Hooks in `src/hooks/` derive filtered/computed data from the store; prefer these over inline `useMemo` in screens
- Spacing and layout constants in `src/constants/layout.ts` and `src/constants/styles.ts` — use these rather than hardcoded numbers
- `scripts/gen-font-metrics.mjs` regenerates `src/components/canvas/fontMetrics.ts`
  from the TTFs. Re-run it only if Geist or Kalam is replaced; the output is checked in
- kaori-app has no test suite. `kaori-core` does — `npm test` there runs the canvas
  scene-model tests (`node:test`, no extra dependency), and `dev-mac.sh` runs them on
  every desktop dev start

## Documentation

Reference docs live in [`docs/`](docs/) (architecture, data model, features,
conventions). They describe **current behavior**, not change history.

After completing a feature or behavior change, **remind the user** that the
relevant `docs/` file(s) may need updating and name which ones. **Do not edit
any file under `docs/` unless the user explicitly confirms and tells you to
update them.** When they confirm, update the affected file(s) and keep
`docs/README.md`'s index in sync.
