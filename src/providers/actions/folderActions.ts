import type { Note, Task, Folder } from '@/types';
import { safeSet, safeMultiSet } from '@/utils/storage';
import { KEYS } from '@/utils/migration';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function createFolderActions(
  folders: Folder[],
  setFolders: SetState<Folder[]>,
  notes: Note[],
  setNotes: SetState<Note[]>,
  tasks: Task[],
  setTasks: SetState<Task[]>,
) {
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
    await safeSet(KEYS.folders, JSON.stringify(nextFolders));
  }

  async function pinFolder(id: string, pinned: boolean) {
    const nextFolders = folders.map(f => f.id === id ? { ...f, pinned } : f);
    setFolders(nextFolders);
    await safeSet(KEYS.folders, JSON.stringify(nextFolders));
  }

  async function deleteFolder(id: string) {
    const nextFolders = folders.filter(f => f.id !== id);
    const nextNotes = notes.map(n => n.folder === id ? { ...n, folder: null } : n);
    const nextTasks = tasks.map(t => t.folder === id ? { ...t, folder: null } : t);
    setFolders(nextFolders);
    setNotes(nextNotes);
    setTasks(nextTasks);
    await safeMultiSet([
      [KEYS.folders, JSON.stringify(nextFolders)],
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.tasks, JSON.stringify(nextTasks)],
    ]);
  }

  async function updateFolderColor(id: string, color: string) {
    const nextFolders = folders.map(f => f.id === id ? { ...f, color } : f);
    setFolders(nextFolders);
    await safeSet(KEYS.folders, JSON.stringify(nextFolders));
  }

  async function renameFolder(id: string, name: string) {
    const nextFolders = folders.map(f => f.id === id ? { ...f, name } : f);
    setFolders(nextFolders);
    await safeSet(KEYS.folders, JSON.stringify(nextFolders));
  }

  async function archiveFolder(id: string, archived: boolean) {
    const nextFolders = folders.map(f => f.id === id ? { ...f, archived } : f);
    const nextNotes = notes.map(n => n.folder === id ? { ...n, archived } : n);
    const nextTasks = tasks.map(t => t.folder === id ? { ...t, archived } : t);
    setFolders(nextFolders);
    setNotes(nextNotes);
    setTasks(nextTasks);
    await safeMultiSet([
      [KEYS.folders, JSON.stringify(nextFolders)],
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.tasks, JSON.stringify(nextTasks)],
    ]);
  }

  return { addFolder, pinFolder, deleteFolder, updateFolderColor, renameFolder, archiveFolder };
}
