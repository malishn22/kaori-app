import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Note, Folder, Profile, Task, Routine } from '@/types';
import { SEED_NOTES, SEED_FOLDERS, SEED_TASKS, SEED_ROUTINES } from '@/types';
import { loadInitialData, DEFAULT_PROFILE, KEYS } from '@/utils/migration';
import { safeSet } from '@/utils/storage';
import { computeDisplayStrings } from '@/utils/time';
import { resolveNoteLinks, extractUrls } from '@/utils/links';
import {
  createNoteActions,
  createTaskActions,
  createFolderActions,
  createRoutineActions,
} from './actions';
import { useSettings } from './SettingsProvider';
import {
  configureNotifications,
  requestPermissions,
  scheduleTaskReminder,
  cancelTaskReminder,
  rescheduleAllReminders,
  scheduleRoutineReminders,
  cancelRoutineReminders,
  rescheduleAllRoutineReminders,
} from '@/utils/notifications';

type StoreContextValue = {
  notes: Note[];
  folders: Folder[];
  profile: Profile;
  tasks: Task[];
  routines: Routine[];
  dataLoaded: boolean;
  addNote: (text: string, folderId: string | null) => void;
  addFolder: (name: string, color: string, note: string) => void;
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, 'text' | 'folder' | 'pinned' | 'links'>>,
  ) => void;
  updateNoteLink: (noteId: string, url: string, label: string) => void;
  deleteNote: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  pinFolder: (id: string, pinned: boolean) => void;
  deleteFolder: (id: string) => void;
  updateFolderColor: (id: string, color: string) => void;
  renameFolder: (id: string, name: string) => void;
  archiveNote: (id: string, archived: boolean) => void;
  archiveFolder: (id: string, archived: boolean) => void;
  reorderFolders: (orderedIds: string[]) => void;
  addTask: (
    title: string,
    dueDate: string | null,
    folderId: string | null,
    reminderAt?: string | null,
    links?: Record<string, string>,
  ) => void;
  updateTask: (
    id: string,
    patch: Partial<
      Pick<Task, 'title' | 'dueDate' | 'reminderAt' | 'folder' | 'pinned' | 'done' | 'links'>
    >,
  ) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string, archived: boolean) => void;
  pinTask: (id: string, pinned: boolean) => void;
  convertTaskToNote: (taskId: string) => string;
  convertNoteToTask: (noteId: string) => string;
  addRoutine: (
    title: string,
    daysOfWeek: number[],
    reminderTime: string,
    folderId: string | null,
    links?: Record<string, string>,
  ) => void;
  updateRoutine: (
    id: string,
    patch: Partial<
      Pick<
        Routine,
        'title' | 'daysOfWeek' | 'reminderTime' | 'folder' | 'pinned' | 'active' | 'links'
      >
    >,
  ) => void;
  toggleRoutineDone: (id: string, date?: Date) => void;
  deleteRoutine: (id: string) => void;
  archiveRoutine: (id: string, archived: boolean) => void;
  pinRoutine: (id: string, pinned: boolean) => void;
};

const StoreContext = createContext<StoreContextValue>({
  notes: SEED_NOTES,
  folders: SEED_FOLDERS,
  profile: DEFAULT_PROFILE,
  tasks: SEED_TASKS,
  routines: SEED_ROUTINES,
  dataLoaded: false,
  addNote: () => {},
  addFolder: () => {},
  updateNote: () => {},
  updateNoteLink: () => {},
  deleteNote: () => {},
  updateProfile: async () => {},
  pinFolder: () => {},
  deleteFolder: () => {},
  updateFolderColor: () => {},
  renameFolder: () => {},
  archiveNote: () => {},
  archiveFolder: () => {},
  reorderFolders: () => {},
  addTask: () => {},
  updateTask: () => {},
  toggleTask: () => {},
  deleteTask: () => {},
  archiveTask: () => {},
  pinTask: () => {},
  convertTaskToNote: () => '',
  convertNoteToTask: () => '',
  addRoutine: () => {},
  updateRoutine: () => {},
  toggleRoutineDone: () => {},
  deleteRoutine: () => {},
  archiveRoutine: () => {},
  pinRoutine: () => {},
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [folders, setFolders] = useState<Folder[]>(SEED_FOLDERS);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [routines, setRoutines] = useState<Routine[]>(SEED_ROUTINES);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { settings } = useSettings();
  const tasksRef = useRef<Task[]>(tasks);
  tasksRef.current = tasks;
  const routinesRef = useRef<Routine[]>(routines);
  routinesRef.current = routines;

  useEffect(() => {
    configureNotifications();
  }, []);

  // Critical path: load data and mark ready so the splash screen can hide
  useEffect(() => {
    loadInitialData().then((data) => {
      setNotes(data.notes);
      setFolders(data.folders);
      setProfile(data.profile);
      setTasks(data.tasks);
      setRoutines(data.routines);
      setDataLoaded(true);
    });
  }, []);

  // Non-critical: notification permissions run after data is ready, decoupled from splash.
  // Read tasks/routines via ref so this doesn't re-run on every edit.
  // rescheduleAllReminders wipes every OS-level notification (tasks + routines), so
  // rescheduleAllRoutineReminders must run immediately after to re-derive routines.
  useEffect(() => {
    if (!dataLoaded || !settings.notificationsEnabled) return;
    requestPermissions().then((granted) => {
      if (granted) {
        rescheduleAllReminders(tasksRef.current).then(() =>
          rescheduleAllRoutineReminders(routinesRef.current),
        );
      }
    });
  }, [dataLoaded, settings.notificationsEnabled]);

  const noteActions = createNoteActions(setNotes, setFolders);
  const rawTaskActions = createTaskActions(setTasks, setFolders);
  const folderActions = createFolderActions(setFolders, setNotes, setTasks);
  const rawRoutineActions = createRoutineActions(setRoutines, setFolders);

  // Notification-aware task action wrappers
  const taskActions = {
    addTask(
      title: string,
      dueDate: string | null,
      folderId: string | null,
      reminderAt?: string | null,
      links?: Record<string, string>,
    ) {
      rawTaskActions.addTask(title, dueDate, folderId, reminderAt, links);
    },
    updateTask(
      id: string,
      patch: Partial<
        Pick<Task, 'title' | 'dueDate' | 'reminderAt' | 'folder' | 'pinned' | 'done' | 'links'>
      >,
    ) {
      rawTaskActions.updateTask(id, patch);
      if (settings.notificationsEnabled && 'reminderAt' in patch) {
        const task = tasksRef.current.find((t) => t.id === id);
        if (task) {
          const updated = { ...task, ...patch };
          if (updated.reminderAt) {
            scheduleTaskReminder(updated);
          } else {
            cancelTaskReminder(id);
          }
        }
      }
    },
    toggleTask(id: string) {
      rawTaskActions.toggleTask(id);
      cancelTaskReminder(id);
    },
    deleteTask(id: string) {
      rawTaskActions.deleteTask(id);
      cancelTaskReminder(id);
    },
    archiveTask(id: string, archived: boolean) {
      rawTaskActions.archiveTask(id, archived);
      if (archived) {
        cancelTaskReminder(id);
      } else if (settings.notificationsEnabled) {
        const task = tasksRef.current.find((t) => t.id === id);
        if (task?.reminderAt) {
          scheduleTaskReminder({ ...task, archived: false });
        }
      }
    },
    pinTask: rawTaskActions.pinTask,
  };

  // Notification-aware routine action wrappers
  const routineActions = {
    addRoutine(
      title: string,
      daysOfWeek: number[],
      reminderTime: string,
      folderId: string | null,
      links?: Record<string, string>,
    ) {
      const id = Date.now().toString();
      rawRoutineActions.addRoutine(id, title, daysOfWeek, reminderTime, folderId, links);
      if (settings.notificationsEnabled) {
        scheduleRoutineReminders({
          id,
          folder: folderId,
          title,
          daysOfWeek,
          reminderTime,
          active: true,
          createdAt: new Date().toISOString(),
          pinned: false,
          completions: {},
          links: links ?? {},
        });
      }
    },
    updateRoutine(
      id: string,
      patch: Partial<
        Pick<
          Routine,
          'title' | 'daysOfWeek' | 'reminderTime' | 'folder' | 'pinned' | 'active' | 'links'
        >
      >,
    ) {
      rawRoutineActions.updateRoutine(id, patch);
      if (
        settings.notificationsEnabled &&
        ('title' in patch || 'daysOfWeek' in patch || 'reminderTime' in patch || 'active' in patch)
      ) {
        const routine = routinesRef.current.find((r) => r.id === id);
        if (routine) {
          const updated = { ...routine, ...patch };
          if (updated.active && updated.daysOfWeek.length > 0) {
            scheduleRoutineReminders(updated);
          } else {
            cancelRoutineReminders(id);
          }
        }
      }
    },
    toggleRoutineDone: rawRoutineActions.toggleRoutineDone,
    deleteRoutine(id: string) {
      rawRoutineActions.deleteRoutine(id);
      cancelRoutineReminders(id);
    },
    archiveRoutine(id: string, archived: boolean) {
      rawRoutineActions.archiveRoutine(id, archived);
      if (archived) {
        cancelRoutineReminders(id);
      } else if (settings.notificationsEnabled) {
        const routine = routinesRef.current.find((r) => r.id === id);
        if (routine?.active && routine.daysOfWeek.length > 0) {
          scheduleRoutineReminders({ ...routine, archived: false });
        }
      }
    },
    pinRoutine: rawRoutineActions.pinRoutine,
  };

  function convertTaskToNote(taskId: string): string {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return '';

    const createdAt = new Date().toISOString();
    const { time, date } = computeDisplayStrings(createdAt);
    const noteId = Date.now().toString();
    const newNote: Note = {
      id: noteId,
      folder: task.folder,
      text: task.title,
      time,
      date,
      createdAt,
      tags: [],
      pinned: task.pinned,
      links: { ...(task.links ?? {}) },
    };

    setNotes((prev) => {
      const next = [newNote, ...prev];
      safeSet(KEYS.notes, JSON.stringify(next));
      return next;
    });

    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });

    cancelTaskReminder(taskId);

    if (extractUrls(task.title).length > 0) {
      resolveNoteLinks(task.title).then((links) => {
        setNotes((prev) => {
          const next = prev.map((n) => (n.id === noteId ? { ...n, links } : n));
          safeSet(KEYS.notes, JSON.stringify(next));
          return next;
        });
      });
    }

    return noteId;
  }

  function convertNoteToTask(noteId: string): string {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return '';

    const createdAt = new Date().toISOString();
    const taskId = Date.now().toString();
    const newTask: Task = {
      id: taskId,
      folder: note.folder,
      title: note.text,
      dueDate: null,
      done: false,
      createdAt,
      pinned: note.pinned,
      links: { ...(note.links ?? {}) },
    };

    setTasks((prev) => {
      const next = [newTask, ...prev];
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });

    setNotes((prev) => {
      if (note.folder) {
        setFolders((prevFolders) => {
          const next = prevFolders.map((f) =>
            f.id !== note.folder ? f : { ...f, count: Math.max(0, f.count - 1) },
          );
          safeSet(KEYS.folders, JSON.stringify(next));
          return next;
        });
      }
      const next = prev.filter((n) => n.id !== noteId);
      safeSet(KEYS.notes, JSON.stringify(next));
      return next;
    });

    return taskId;
  }

  async function updateProfile(patch: Partial<Profile>) {
    const nextProfile = { ...profile, ...patch };
    setProfile(nextProfile);
    await safeSet(KEYS.profile, JSON.stringify(nextProfile));
  }

  return (
    <StoreContext.Provider
      value={{
        notes,
        folders,
        profile,
        tasks,
        routines,
        dataLoaded,
        ...noteActions,
        ...taskActions,
        ...folderActions,
        ...routineActions,
        updateProfile,
        convertTaskToNote,
        convertNoteToTask,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
