import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Note, Folder, Profile, Task } from '@/types';
import { SEED_NOTES, SEED_FOLDERS, SEED_TASKS } from '@/types';
import { loadInitialData, DEFAULT_PROFILE, KEYS } from '@/utils/migration';
import { safeSet } from '@/utils/storage';
import { computeDisplayStrings } from '@/utils/time';
import { resolveNoteLinks, extractUrls } from '@/utils/links';
import { createNoteActions, createTaskActions, createFolderActions } from './actions';

type StoreContextValue = {
  notes: Note[];
  folders: Folder[];
  profile: Profile;
  tasks: Task[];
  addNote: (text: string, folderId: string | null) => void;
  addFolder: (name: string, color: string, note: string) => void;
  updateNote: (id: string, patch: Partial<Pick<Note, 'text' | 'folder' | 'pinned' | 'links'>>) => void;
  updateNoteLink: (noteId: string, url: string, label: string) => void;
  deleteNote: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  pinFolder: (id: string, pinned: boolean) => void;
  deleteFolder: (id: string) => void;
  updateFolderColor: (id: string, color: string) => void;
  renameFolder: (id: string, name: string) => void;
  archiveNote: (id: string, archived: boolean) => void;
  archiveFolder: (id: string, archived: boolean) => void;
  addTask: (title: string, dueDate: string | null, folderId: string | null) => void;
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'dueDate' | 'folder' | 'pinned' | 'done'>>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string, archived: boolean) => void;
  pinTask: (id: string, pinned: boolean) => void;
  convertTaskToNote: (taskId: string) => string;
  convertNoteToTask: (noteId: string) => string;
};

const StoreContext = createContext<StoreContextValue>({
  notes: SEED_NOTES,
  folders: SEED_FOLDERS,
  profile: DEFAULT_PROFILE,
  tasks: SEED_TASKS,
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
  addTask: () => {},
  updateTask: () => {},
  toggleTask: () => {},
  deleteTask: () => {},
  archiveTask: () => {},
  pinTask: () => {},
  convertTaskToNote: () => '',
  convertNoteToTask: () => '',
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [folders, setFolders] = useState<Folder[]>(SEED_FOLDERS);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);

  useEffect(() => {
    loadInitialData().then((data) => {
      setNotes(data.notes);
      setFolders(data.folders);
      setProfile(data.profile);
      setTasks(data.tasks);
    });
  }, []);

  const noteActions = createNoteActions(setNotes, setFolders);
  const taskActions = createTaskActions(setTasks, setFolders);
  const folderActions = createFolderActions(setFolders, setNotes, setTasks);

  function convertTaskToNote(taskId: string): string {
    const task = tasks.find(t => t.id === taskId);
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
      links: {},
    };

    setNotes(prev => {
      const next = [newNote, ...prev];
      safeSet(KEYS.notes, JSON.stringify(next));
      return next;
    });

    setTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });

    if (extractUrls(task.title).length > 0) {
      resolveNoteLinks(task.title).then((links) => {
        setNotes(prev => {
          const next = prev.map(n => n.id === noteId ? { ...n, links } : n);
          safeSet(KEYS.notes, JSON.stringify(next));
          return next;
        });
      });
    }

    return noteId;
  }

  function convertNoteToTask(noteId: string): string {
    const note = notes.find(n => n.id === noteId);
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
    };

    setTasks(prev => {
      const next = [newTask, ...prev];
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });

    setNotes(prev => {
      if (note.folder) {
        setFolders(prevFolders => {
          const next = prevFolders.map(f => f.id !== note.folder ? f : { ...f, count: Math.max(0, f.count - 1) });
          safeSet(KEYS.folders, JSON.stringify(next));
          return next;
        });
      }
      const next = prev.filter(n => n.id !== noteId);
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
    <StoreContext.Provider value={{
      notes, folders, profile, tasks,
      ...noteActions,
      ...taskActions,
      ...folderActions,
      updateProfile,
      convertTaskToNote,
      convertNoteToTask,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
