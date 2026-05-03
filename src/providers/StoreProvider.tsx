import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, Folder, Profile, Task } from '@/types';
import { SEED_NOTES, SEED_FOLDERS, SEED_TASKS } from '@/types';
import { computeDisplayStrings } from '@/utils/time';
import { resolveNoteLinks, extractUrls } from '@/utils/links';

const KEYS = {
  notes: '@kaori_notes',
  folders: '@kaori_folders',
  profile: '@kaori_profile',
  tasks: '@kaori_tasks',
} as const;

const RESET_KEY = '@kaori_reset_v2';

const DEFAULT_PROFILE: Profile = {
  name: 'Mali',
  initial: 'm',
  defaultFolder: 'inbox',
};

type StoreContextValue = {
  notes: Note[];
  folders: Folder[];
  profile: Profile;
  tasks: Task[];
  addNote: (text: string, folderId: string | null) => Promise<void>;
  addFolder: (name: string, color: string, note: string) => Promise<void>;
  updateNote: (id: string, patch: Partial<Pick<Note, 'text' | 'folder' | 'pinned' | 'links'>>) => Promise<void>;
  updateNoteLink: (noteId: string, url: string, label: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  pinFolder: (id: string, pinned: boolean) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  updateFolderColor: (id: string, color: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  archiveNote: (id: string, archived: boolean) => Promise<void>;
  archiveFolder: (id: string, archived: boolean) => Promise<void>;
  addTask: (title: string, body: string, dueDate: string | null, folderId: string | null) => Promise<void>;
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'body' | 'dueDate' | 'folder' | 'pinned' | 'done'>>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  archiveTask: (id: string, archived: boolean) => Promise<void>;
  pinTask: (id: string, pinned: boolean) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue>({
  notes: SEED_NOTES,
  folders: SEED_FOLDERS,
  profile: DEFAULT_PROFILE,
  tasks: SEED_TASKS,
  addNote: async () => {},
  addFolder: async () => {},
  updateNote: async () => {},
  updateNoteLink: async () => {},
  deleteNote: async () => {},
  updateProfile: async () => {},
  pinFolder: async () => {},
  deleteFolder: async () => {},
  updateFolderColor: async () => {},
  renameFolder: async () => {},
  archiveNote: async () => {},
  archiveFolder: async () => {},
  addTask: async () => {},
  updateTask: async () => {},
  toggleTask: async () => {},
  deleteTask: async () => {},
  archiveTask: async () => {},
  pinTask: async () => {},
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [folders, setFolders] = useState<Folder[]>(SEED_FOLDERS);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);

  useEffect(() => {
    AsyncStorage.getItem(RESET_KEY).then(async (resetDone) => {
      if (!resetDone) {
        await AsyncStorage.multiRemove([KEYS.notes, KEYS.folders, KEYS.profile]);
        await AsyncStorage.setItem(RESET_KEY, '1');
      }

      AsyncStorage.multiGet([KEYS.notes, KEYS.folders, KEYS.profile, KEYS.tasks]).then((results) => {
      const rawNotes = results[0][1];
      const rawFolders = results[1][1];
      const rawProfile = results[2][1];
      const rawTasks = results[3][1];

      if (!rawNotes) {
        // First launch: seed and persist
        AsyncStorage.multiSet([
          [KEYS.notes, JSON.stringify(SEED_NOTES)],
          [KEYS.folders, JSON.stringify(SEED_FOLDERS)],
          [KEYS.profile, JSON.stringify(DEFAULT_PROFILE)],
          [KEYS.tasks, JSON.stringify(SEED_TASKS)],
        ]);
        return;
      }

      try {
        if (rawNotes) setNotes(JSON.parse(rawNotes).map((n: Note) => ({ ...n, links: n.links ?? {} })));
        if (rawFolders) setFolders(JSON.parse(rawFolders));
        if (rawProfile) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(rawProfile) });
        if (rawTasks) setTasks(JSON.parse(rawTasks));
      } catch (e) {
        console.warn('[Kaori] Failed to parse stored data:', e);
      }
      });
    });
  }, []);

  async function addNote(text: string, folderId: string | null) {
    const createdAt = new Date().toISOString();
    const { time, date } = computeDisplayStrings(createdAt);
    const noteId = Date.now().toString();
    const newNote: Note = {
      id: noteId,
      folder: folderId,
      text,
      time,
      date,
      createdAt,
      tags: [],
      pinned: false,
      links: {},
    };

    const nextNotes = [newNote, ...notes];

    const nextFolders = folderId
      ? folders.map((f) => {
          if (f.id !== folderId) return f;
          return { ...f, count: f.count + 1, updated: new Date().toISOString() };
        })
      : folders;

    setNotes(nextNotes);
    setFolders(nextFolders);

    await AsyncStorage.multiSet([
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.folders, JSON.stringify(nextFolders)],
    ]);

    // Resolve link titles in the background
    if (extractUrls(text).length > 0) {
      resolveNoteLinks(text).then(async (links) => {
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === noteId ? { ...n, links } : n));
          AsyncStorage.setItem(KEYS.notes, JSON.stringify(updated));
          return updated;
        });
      });
    }
  }

  async function addFolder(name: string, color: string, note: string) {
    const createdAt = new Date().toISOString();
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      count: 0,
      color,
      updated: createdAt,
      note,
      createdAt,
      pinned: false,
    };
    const nextFolders = [...folders, newFolder];
    setFolders(nextFolders);
    await AsyncStorage.setItem(KEYS.folders, JSON.stringify(nextFolders));
  }

  async function pinFolder(id: string, pinned: boolean) {
    const nextFolders = folders.map(f => f.id === id ? { ...f, pinned } : f);
    setFolders(nextFolders);
    await AsyncStorage.setItem(KEYS.folders, JSON.stringify(nextFolders));
  }

  async function deleteFolder(id: string) {
    const nextFolders = folders.filter(f => f.id !== id);
    const nextNotes = notes.map(n => n.folder === id ? { ...n, folder: null } : n);
    const nextTasks = tasks.map(t => t.folder === id ? { ...t, folder: null } : t);
    setFolders(nextFolders);
    setNotes(nextNotes);
    setTasks(nextTasks);
    await AsyncStorage.multiSet([
      [KEYS.folders, JSON.stringify(nextFolders)],
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.tasks, JSON.stringify(nextTasks)],
    ]);
  }

  async function updateFolderColor(id: string, color: string) {
    const nextFolders = folders.map(f => f.id === id ? { ...f, color } : f);
    setFolders(nextFolders);
    await AsyncStorage.setItem(KEYS.folders, JSON.stringify(nextFolders));
  }

  async function renameFolder(id: string, name: string) {
    const nextFolders = folders.map(f => f.id === id ? { ...f, name } : f);
    setFolders(nextFolders);
    await AsyncStorage.setItem(KEYS.folders, JSON.stringify(nextFolders));
  }

  async function updateNote(id: string, patch: Partial<Pick<Note, 'text' | 'folder' | 'pinned' | 'links'>>) {
    const nextNotes = notes.map(n => n.id === id ? { ...n, ...patch } : n);
    setNotes(nextNotes);
    await AsyncStorage.setItem(KEYS.notes, JSON.stringify(nextNotes));

    // Resolve titles for any new URLs in the text
    if (patch.text && extractUrls(patch.text).length > 0) {
      const mergedExisting = { ...notes.find(n => n.id === id)?.links, ...patch.links };
      resolveNoteLinks(patch.text, mergedExisting).then(async (links) => {
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === id ? { ...n, links } : n));
          AsyncStorage.setItem(KEYS.notes, JSON.stringify(updated));
          return updated;
        });
      });
    }
  }

  async function updateNoteLink(noteId: string, url: string, label: string) {
    const nextNotes = notes.map(n => {
      if (n.id !== noteId) return n;
      return { ...n, links: { ...n.links, [url]: label } };
    });
    setNotes(nextNotes);
    await AsyncStorage.setItem(KEYS.notes, JSON.stringify(nextNotes));
  }

  async function deleteNote(id: string) {
    const note = notes.find(n => n.id === id);
    const nextNotes = notes.filter(n => n.id !== id);
    const nextFolders = note?.folder
      ? folders.map(f => f.id !== note.folder ? f : { ...f, count: Math.max(0, f.count - 1) })
      : folders;
    setNotes(nextNotes);
    setFolders(nextFolders);
    await AsyncStorage.multiSet([
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.folders, JSON.stringify(nextFolders)],
    ]);
  }

  async function archiveNote(id: string, archived: boolean) {
    const nextNotes = notes.map(n => n.id === id ? { ...n, archived } : n);
    setNotes(nextNotes);
    await AsyncStorage.setItem(KEYS.notes, JSON.stringify(nextNotes));
  }

  async function archiveFolder(id: string, archived: boolean) {
    const nextFolders = folders.map(f => f.id === id ? { ...f, archived } : f);
    const nextNotes = notes.map(n => n.folder === id ? { ...n, archived } : n);
    const nextTasks = tasks.map(t => t.folder === id ? { ...t, archived } : t);
    setFolders(nextFolders);
    setNotes(nextNotes);
    setTasks(nextTasks);
    await AsyncStorage.multiSet([
      [KEYS.folders, JSON.stringify(nextFolders)],
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.tasks, JSON.stringify(nextTasks)],
    ]);
  }

  async function addTask(title: string, body: string, dueDate: string | null, folderId: string | null) {
    const createdAt = new Date().toISOString();
    const newTask: Task = {
      id: Date.now().toString(),
      folder: folderId,
      title,
      body,
      dueDate,
      done: false,
      createdAt,
      pinned: false,
    };
    const nextTasks = [newTask, ...tasks];
    const nextFolders = folderId
      ? folders.map(f => f.id !== folderId ? f : { ...f, updated: new Date().toISOString() })
      : folders;
    setTasks(nextTasks);
    setFolders(nextFolders);
    await AsyncStorage.multiSet([
      [KEYS.tasks, JSON.stringify(nextTasks)],
      [KEYS.folders, JSON.stringify(nextFolders)],
    ]);
  }

  async function updateTask(id: string, patch: Partial<Pick<Task, 'title' | 'body' | 'dueDate' | 'folder' | 'pinned' | 'done'>>) {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, ...patch } : t);
    setTasks(nextTasks);
    await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(nextTasks));
  }

  async function toggleTask(id: string) {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done, archived: !t.done } : t);
    setTasks(nextTasks);
    await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(nextTasks));
  }

  async function deleteTask(id: string) {
    const nextTasks = tasks.filter(t => t.id !== id);
    setTasks(nextTasks);
    await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(nextTasks));
  }

  async function archiveTask(id: string, archived: boolean) {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, archived } : t);
    setTasks(nextTasks);
    await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(nextTasks));
  }

  async function pinTask(id: string, pinned: boolean) {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, pinned } : t);
    setTasks(nextTasks);
    await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(nextTasks));
  }

  async function updateProfile(patch: Partial<Profile>) {
    const nextProfile = { ...profile, ...patch };
    setProfile(nextProfile);
    await AsyncStorage.setItem(KEYS.profile, JSON.stringify(nextProfile));
  }

  return (
    <StoreContext.Provider value={{ notes, folders, profile, tasks, addNote, addFolder, updateNote, updateNoteLink, deleteNote, updateProfile, pinFolder, deleteFolder, updateFolderColor, renameFolder, archiveNote, archiveFolder, addTask, updateTask, toggleTask, deleteTask, archiveTask, pinTask }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
