import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Note, Folder, Profile, Task } from '@/types';
import { SEED_NOTES, SEED_FOLDERS, SEED_TASKS } from '@/types';
import { loadInitialData, DEFAULT_PROFILE, KEYS } from '@/utils/migration';
import { safeSet } from '@/utils/storage';
import { createNoteActions, createTaskActions, createFolderActions } from './actions';

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
    loadInitialData().then((data) => {
      setNotes(data.notes);
      setFolders(data.folders);
      setProfile(data.profile);
      setTasks(data.tasks);
    });
  }, []);

  const noteActions = createNoteActions(notes, setNotes, folders, setFolders);
  const taskActions = createTaskActions(tasks, setTasks, folders, setFolders);
  const folderActions = createFolderActions(folders, setFolders, notes, setNotes, tasks, setTasks);

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
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
