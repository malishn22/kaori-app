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

## Routines

Recurring reminders for things done on a repeating weekly schedule (e.g. "swim
lesson" every Thursday/Friday, "stretch" daily at 4pm) — distinct from Tasks,
which are one-off. A routine has a set of `daysOfWeek` and a single
`reminderTime` ('HH:mm', date-independent). `active` pauses/resumes a routine
(and its notifications) without deleting it — this is separate from
`archived`, which trashes it like a note/task. Each routine also tracks daily
completion via a `completions` map keyed by date, surfaced as a "done today"
toggle — this has no notification side effect.

- Actions: `addRoutine`, `updateRoutine`, `toggleRoutineDone`, `deleteRoutine`,
  `archiveRoutine`, `pinRoutine` —
  [routineActions.ts](../src/providers/actions/routineActions.ts).
- Screens: [routine/new.tsx](../app/routine/new.tsx),
  [routine/[id].tsx](../app/routine/[id].tsx).
- Card: [RoutineCard](../src/components/ui/cards/RoutineCard.tsx).

## Reminders & notifications

Each task can carry an absolute `reminderAt` datetime (per-task, not a global
preset); the reminder fires a **one-shot** local notification at that time.
Routines instead fire a **weekly-repeating** notification per selected weekday
at their `reminderTime`, using each platform's native recurring trigger so the
OS reschedules the next occurrence itself.

- Scheduling logic: [src/utils/notifications.ts](../src/utils/notifications.ts)
  — tasks: `scheduleTaskReminder`, `cancelTaskReminder`, `cancelAllReminders`,
  `rescheduleAllReminders`; routines: `scheduleRoutineReminders`,
  `cancelRoutineReminders`, `rescheduleAllRoutineReminders`; shared:
  `configureNotifications` and `requestPermissions`.
- iOS uses `expo-notifications`; Android uses notifee with an exact-alarm,
  high-importance channel.
- A registry at `@kaori_notif_registry` maps `taskId → { notifId }` so a task
  reminder can be cancelled when the task is completed, deleted, archived, or
  rescheduled. Routines use a separate registry at
  `@kaori_routine_notif_registry` mapping `routineId → notifId[]`, since one
  routine can have up to 7 scheduled notifications (one per selected weekday).
- **Expo Go is unsupported** for notifications — every function early-returns
  when `IS_EXPO_GO` is true. Past or invalid dates are skipped.
- On startup, and whenever the Settings notifications toggle is turned back
  on, `StoreProvider`/the settings screen calls `rescheduleAllReminders` for
  active tasks followed by `rescheduleAllRoutineReminders` for active,
  non-archived routines — in that order, since `rescheduleAllReminders` wipes
  _all_ scheduled notifications (tasks and routines alike) before
  re-scheduling tasks, so routines must be re-derived immediately after.
  Turning the toggle off cancels everything via `cancelAllReminders`.
- Time picker: [ReminderPicker.tsx](../src/components/ui/pickers/ReminderPicker.tsx).
  When a task has no reminder yet, the picker opens on a **1:00 AM** default
  (`DEFAULT_HOUR`/`DEFAULT_MINUTE`) on the due date so the hour wheel starts at the
  top (01) rather than midnight (12); editing an existing reminder opens on its
  saved time. Routines reuse the same picker for `reminderTime`, discarding
  the date component.

## Folders

Color-coded containers for notes, tasks, and routines, with drag-to-reorder.

- Actions: `addFolder`, `pinFolder`, `deleteFolder`, `updateFolderColor`,
  `renameFolder`, `archiveFolder`, `reorderFolders` —
  [folderActions.ts](../src/providers/actions/folderActions.ts).
- Reordering persists via the folder `order` field (`reorderFolders`).
- Deleting a folder orphans its notes/tasks/routines (sets `folder` to
  `null`); archiving a folder cascades the `archived` flag to its
  notes/tasks/routines.
- Screens: [folder/new.tsx](../app/folder/new.tsx),
  [folder/[id].tsx](../app/folder/[id].tsx). Reorder UI:
  [DraggableFolderList](../src/components/ui/cards/DraggableFolderList.tsx).

## Canvas

An infinite Excalidraw-style drawing surface, as a fifth tab. Select, hand,
pencil, rectangle, ellipse, line, arrow, text, frame and eraser; resize and
rotate handles, endpoint grips on lines and arrows, marquee selection, layer
ordering, and undo/redo. Two-finger pan and pinch are live under every tool;
with the select tool a drag from empty canvas pans as well, since reaching for
the hand tool on a phone costs more than rubber-banding is worth.

The style controls are a floating panel opened from a button on the surface, so
they take no space from the drawing and opening them shifts nothing underneath.
Rows follow the selection — fill only for shapes, size and alignment only for
text.

Canvases can be renamed in place, pinned by swiping the row, archived (with
their own page in the archived browser) and deleted. Pan speed is adjustable.

The scene model, interaction reducer and geometry are `kaori-core`, shared with
kaori-desktop — see [canvas.md](canvas.md).

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
| `useActiveRoutines`     | Non-archived routines                                    |
| `useFolderNotes`        | Notes for a folder + derived counts                      |
| `useFolderTasks`        | Tasks for a folder + open/done counts                    |
| `useFolderRoutines`     | Routines for a folder + active/paused counts             |
| `useAnimatedPopup`      | `Animated.Value` + opacity interpolation for popups      |
| `useBottomSheetControl` | Ref + expand/collapse wiring for the gorhom bottom sheet |
| `useHapticFeedback`     | Haptics wrapper that respects the `hapticOnSave` setting |
| `useInlineEdit`         | Edit-mode + draft state with commit/cancel               |
| `useConfirmAction`      | Two-tap confirm UX (tap once to arm, again to execute)   |
| `useKeyboardHeight`     | Tracks keyboard height from `Keyboard` events            |
