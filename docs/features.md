# Features

What each user-facing feature does and where the code lives. State and actions
referenced here are owned by `StoreProvider` (see
[architecture.md](architecture.md)).

## Notes

Create, edit, pin, archive, and organize notes into folders. Notes support link
detection: when a note's text contains URLs, metadata is resolved and cached in
the note's `links` map via
[resolveLinksFor.ts](../src/providers/actions/resolveLinksFor.ts). `updateNote`
re-resolves links when the text changes.

- Actions: `addNote`, `updateNote`, `updateNoteLink`, `deleteNote`,
  `archiveNote` — [noteActions.ts](../src/providers/actions/noteActions.ts).
- `addNote`/`deleteNote` keep the owning folder's cached `count` in sync.
- Screens: [note/new.tsx](../app/note/new.tsx),
  [note/[id].tsx](../app/note/[id].tsx).
- Card: [NoteCard](../src/components/ui/cards/NoteCard.tsx).

## Tasks

A task list with due dates, completion, pinning, and archiving. Completing a
task (`toggleTask`) auto-archives it; unarchiving (`archiveTask`) resets `done`.
Tasks and notes can be converted into one another (`convertTaskToNote`,
`convertNoteToTask`) — conversion resolves links and detaches the source.

- Actions: `addTask`, `updateTask`, `toggleTask`, `deleteTask`, `archiveTask`,
  `pinTask` — [taskActions.ts](../src/providers/actions/taskActions.ts).
- Like notes, `updateTask` re-resolves links when the title changes.
- Screens: [task/new.tsx](../app/task/new.tsx),
  [task/[id].tsx](../app/task/[id].tsx).
- Card: [TaskCard](../src/components/ui/cards/TaskCard.tsx).

## Reminders & notifications

Each task can carry an absolute `reminderAt` datetime (per-task, not a global
preset). The reminder fires a local notification at that time.

- Scheduling logic: [src/utils/notifications.ts](../src/utils/notifications.ts)
  — `scheduleTaskReminder`, `cancelTaskReminder`, `cancelAllReminders`,
  `rescheduleAllReminders`, plus `configureNotifications` and
  `requestPermissions`.
- iOS uses `expo-notifications`; Android uses notifee with an exact-alarm,
  high-importance channel.
- A registry at `@kaori_notif_registry` maps `taskId → { notifId }` so a
  reminder can be cancelled when the task is completed, deleted, archived, or
  rescheduled.
- **Expo Go is unsupported** for notifications — every function early-returns
  when `IS_EXPO_GO` is true. Past or invalid dates are skipped.
- On startup `StoreProvider` calls `rescheduleAllReminders` for active
  (non-done, non-archived) tasks.
- Time picker: [ReminderPicker.tsx](../src/components/ui/pickers/ReminderPicker.tsx).
  When a task has no reminder yet, the picker opens on a **1:00 AM** default
  (`DEFAULT_HOUR`/`DEFAULT_MINUTE`) on the due date so the hour wheel starts at the
  top (01) rather than midnight (12); editing an existing reminder opens on its
  saved time.

## Folders

Color-coded containers for notes and tasks, with drag-to-reorder.

- Actions: `addFolder`, `pinFolder`, `deleteFolder`, `updateFolderColor`,
  `renameFolder`, `archiveFolder`, `reorderFolders` —
  [folderActions.ts](../src/providers/actions/folderActions.ts).
- Reordering persists via the folder `order` field (`reorderFolders`).
- Deleting a folder orphans its notes/tasks (sets `folder` to `null`);
  archiving a folder cascades to its notes/tasks.
- Screens: [folder/new.tsx](../app/folder/new.tsx),
  [folder/[id].tsx](../app/folder/[id].tsx). Reorder UI:
  [DraggableFolderList](../src/components/ui/cards/DraggableFolderList.tsx).

## Theming

Users pick a **tone** and **accent** from settings; the choice persists via
`SettingsProvider` and is applied through CSS variables (see
[architecture.md → Styling & theming](architecture.md#styling--theming)).
Selection UI is the generic
[SettingSheet](../src/components/ui/settings/SettingSheet.tsx).

## Hooks

Derived-data hooks in [src/hooks/](../src/hooks/) (exported from
[src/hooks/index.ts](../src/hooks/index.ts)):

| Hook                    | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `useActiveFolders`      | Non-archived folders, sorted by `order`                  |
| `useActiveNotes`        | Non-archived notes                                       |
| `useActiveTasks`        | Non-archived tasks                                       |
| `useFolderNotes`        | Notes for a folder + derived counts                      |
| `useFolderTasks`        | Tasks for a folder + open/done counts                    |
| `useAnimatedPopup`      | `Animated.Value` + opacity interpolation for popups      |
| `useBottomSheetControl` | Ref + expand/collapse wiring for the gorhom bottom sheet |
| `useHapticFeedback`     | Haptics wrapper that respects the `hapticOnSave` setting |
| `useInlineEdit`         | Edit-mode + draft state with commit/cancel               |
| `useConfirmAction`      | Two-tap confirm UX (tap once to arm, again to execute)   |
| `useKeyboardHeight`     | Tracks keyboard height from `Keyboard` events            |
