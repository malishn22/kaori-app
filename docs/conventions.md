# Conventions & Workflows

Short reference for how code is organized and shipped. The **canonical** command
lists live in [CLAUDE.md](../CLAUDE.md) and the [root README](../README.md);
this file points to them rather than duplicating, to avoid drift.

## Coding conventions

- **Path alias** — `@/*` resolves to both the project root and `src/`. Prefer
  `@/components/ui`, `@/providers/StoreProvider`, `@/theme`, etc.
- **UI imports** — all UI components are barrel-exported from
  [src/components/ui/index.ts](../src/components/ui/index.ts); import from
  `@/components/ui`, not deep paths.
- **Icons** — named SVG exports from
  [assets/icons/index.tsx](../assets/icons/index.tsx), e.g.
  `import { PenIcon, TaskIcon } from '@/...'`.
- **Derived data** — use the hooks in [src/hooks/](../src/hooks/) (see
  [features.md → Hooks](features.md#hooks)) instead of inline `useMemo` in
  screens.
- **Spacing/layout** — use the constants in
  [src/constants/](../src/constants/) rather than hardcoded numbers.
- **Theming** — style via `className="bg-theme-*"` (NativeWind CSS variables) or
  the [useTheme](../src/theme/useTheme.ts) hook; see
  [architecture.md](architecture.md#styling--theming).
- kaori-app has no test suite. `kaori-core` has one: `npm test` builds and then runs
  `node:test` files under `kaori-core/test/`, covering the canvas scene model (geometry,
  transforms, bindings, frames, the reducer's gestures, and serialization). It is the
  regression net for canvas work — see [canvas.md](canvas.md).

## Quality gate

Run **`npm run check`** before considering any task done — it must exit 0. It
composes typecheck + lint + format check. See
[CLAUDE.md → Quality Checks](../CLAUDE.md#quality-checks) for the individual
scripts (`typecheck`, `lint`, `lint:fix`, `format`, `format:check`). Lint
warnings are tolerated; lint errors are not.

## Build & release

Full instructions are in [CLAUDE.md → Building for iOS & Android](../CLAUDE.md#building-for-ios--android)
and the [root README](../README.md#building-for-production). Summary:

- **Dev:** `npm start` (Expo Go), `npm run ios`, `npm run android`.
- **Local release:** `expo run:ios --configuration Release` /
  `expo run:android --variant release`.
- **Android release APK:** `./scripts/build-android-release.sh` — wraps prebuild,
  the mandatory `gradle.properties` memory patch (avoids a `Metaspace`
  `OutOfMemoryError`), and `assembleRelease`. Output:
  `android/app/build/outputs/apk/release/app-release.apk`.
- **Cloud:** EAS Build (`eas build --platform ios|android|all`) handles signing.
- App identifiers: iOS `com.kaori.app`, Android `com.kaori.app`.
