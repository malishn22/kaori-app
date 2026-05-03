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
  addTask: (title: string, body: string, dueDate: string | null, folderId: string | null) => void;
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'body' | 'dueDate' | 'folder' | 'pinned' | 'done'>>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string, archived: boolean) => void;
  pinTask: (id: string, pinned: boolean) => void;
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
