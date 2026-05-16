# Kaori

A minimal, offline-first note and task manager for iOS and Android, built with Expo and React Native.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 55 + React Native 0.83 |
| Language | TypeScript 5.9 (strict) |
| Routing | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind CSS) |
| Animations | React Native Reanimated 4 + Gesture Handler |
| State | React Context API |
| Storage | AsyncStorage (local, no backend) |
| Notifications | Expo Notifications |

## Prerequisites

- **Node.js** 18+
- **npm** or yarn
- **Expo CLI** — `npm install -g expo-cli`
- **iOS**: macOS + Xcode 15+ (for simulator or device builds)
- **Android**: Android Studio + Android SDK (API 24+)

## Setup

```bash
git clone <repo-url>
cd kaori-app
npm install
```

## Running

### Development (Expo Go)
```bash
npm start
```
Scan the QR code with the Expo Go app on your device.

### iOS Simulator
```bash
npm run ios
# or
expo run:ios
```

### Android Emulator / Device
```bash
npm run android
# or
expo run:android
```

### Web (limited)
```bash
npm run web
```

## Building for Production

### Local builds
Requires native toolchains installed (Xcode / Android Studio).

```bash
# iOS — production build
expo run:ios --configuration Release

# Android — production build
expo run:android --variant release
```

### EAS Build (recommended)
[EAS Build](https://docs.expo.dev/build/introduction/) handles signing, certificates, and CI/CD without needing Xcode or Android Studio locally.

```bash
npm install -g eas-cli
eas login
eas build --platform ios      # or android | all
```

App identifiers:
- iOS bundle ID: `com.kaori.app`
- Android package: `com.kaori.app`

## Project Structure

```
app/                    # Screens (Expo Router file-based routing)
  (tabs)/               # Tab screens: today, tasks, projects
  note/                 # Note create & edit screens
  task/                 # Task create & edit screens
  folder/               # Folder create & edit screens
  archived.tsx          # Archived items
  profile.tsx           # User profile

src/
  components/ui/        # Reusable UI components
  providers/            # React Context: store, settings, UI state
  hooks/                # Custom hooks for derived data
  constants/            # Layout, style, and color constants
  theme/                # Design tokens and theming system
  types/                # TypeScript interfaces
  utils/                # Storage, formatting, notification helpers

assets/
  icons/                # SVG icon components
  fonts/                # Kalam font
  textures/             # Background textures
```

## Features

- **Notes** — Create, edit, pin, archive, and organize notes into folders
- **Tasks** — Task list with due dates, reminders, pin, and archive
- **Folders** — Color-coded folders for organizing notes and tasks
- **Theming** — Multiple tone and accent color combinations (dark UI)
- **Notifications** — Per-task reminder scheduling via Expo Notifications
- **Drag to reorder** — Reorder folders with drag-and-drop
- **Swipe to pin** — Swipe note/task cards to toggle pin status
- **Offline-first** — All data stored locally via AsyncStorage; no account or network required

## Data & Privacy

All data is stored locally on-device using AsyncStorage. There is no backend, no sync, and no data leaves the device.
