# Kaori — Codebase Guide

## Dev Commands

```bash
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
  (tabs)/               # Tab group: index, tasks, projects, settings
  note/[id].tsx         # Note detail/editor
  note/new.tsx          # New note
  task/[id].tsx         # Task detail/editor
  task/new.tsx          # New task
  folder/[id].tsx       # Folder detail
  folder/new.tsx        # New folder
  archived.tsx          # Archived items
  profile.tsx           # User profile

src/
  components/ui/        # All UI components
    cards/              # NoteCard, TaskCard, FolderCard, SwipeablePinWrapper
    layout/             # TabBar, PageHeader, FAB, EmptyState, PopupMenu
    primitives/         # ThemeText, Input, Chip, FormattedText, Divider
    pickers/            # CalendarPicker, FolderChipSelector, ReminderPicker
    sheets/             # BottomSheet, ColorSwatchPicker
    settings/           # SettingSheet
  providers/            # Context API state management
    StoreProvider.tsx   # Main store: notes, tasks, folders, profile
    SettingsProvider.tsx  # Theme tone & accent color
    SettingSheetProvider.tsx  # Bottom sheet open/close state
    actions/            # Action creators: noteActions, taskActions, folderActions
  hooks/                # Custom hooks (useActiveNotes, useHapticFeedback, etc.)
  constants/            # Layout, style, color, and option constants
  theme/                # Design tokens, CSS variable injection, useTheme hook
  types/                # TypeScript types (Folder, Note, Task, Profile)
  utils/                # storage, time, noteFormat, links, notifications, migration

assets/
  icons/index.tsx       # All icon components (SVG-based)
  fonts/                # Custom fonts (Kalam)
  textures/             # Background textures
```

## Architecture

### State Management

Three React Context providers, composed in `app/_layout.tsx`:

- **StoreProvider** — all app data (notes, tasks, folders, profile); persists via AsyncStorage
- **SettingsProvider** — theme tone and accent; persists via AsyncStorage
- **SettingSheetProvider** — ephemeral UI state for the settings bottom sheet

Action creators live in `src/providers/actions/` and are called by the providers. Data is loaded from storage via `src/utils/migration.ts` on app start.

### Navigation

Expo Router (file-based). Tabs defined in `app/(tabs)/_layout.tsx` using a custom `TabBar` component. The custom TabBar hardcodes the tab list in `src/components/ui/layout/TabBar.tsx` — adding a tab requires updating both the `_layout.tsx` registration and the `tabs` array in TabBar.

### Styling

NativeWind v4 (Tailwind for React Native). Theme colors are injected as CSS variables (e.g. `--color-bg`, `--color-ink`) in `src/theme/themeVars.ts` and consumed via `className="bg-theme-bg"` etc. The `useTheme()` hook provides typed color values for imperative styling.

## Key Conventions

- Path alias `@/*` resolves to both the project root and `src/` — prefer `@/components/ui`, `@/providers/StoreProvider`, etc.
- UI components are barrel-exported from `src/components/ui/index.ts`; always import from `@/components/ui`
- Icons are in `assets/icons/index.tsx`; import named exports like `{ PenIcon, TaskIcon }`
- Hooks in `src/hooks/` derive filtered/computed data from the store; prefer these over inline `useMemo` in screens
- Spacing and layout constants in `src/constants/layout.ts` and `src/constants/styles.ts` — use these rather than hardcoded numbers
- No test suite exists currently
