import type { Note, Task, Folder } from '@/types';
import { safeSet } from '@/utils/storage';
import { KEYS } from '@/utils/migration';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function createFolderActions(
  setFolders: SetState<Folder[]>,
  setNotes: SetState<Note[]>,
  setTasks: SetState<Task[]>,
) {
  function addFolder(name: string, color: string, note: string) {
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
    setFolders(prev => {
      const next = [...prev, newFolder];
      safeSet(KEYS.folders, JSON.stringify(next));
      return next;
    });
  }

  function pinFolder(id: string, pinned: boolean) {
    setFolders(prev => {
      const next = prev.map(f => f.id === id ? { ...f, pinned } : f);
      safeSet(KEYS.folders, JSON.stringify(next));
      return next;
    });
  }

  function deleteFolder(id: string) {
    setFolders(prev => {
      const next = prev.filter(f => f.id !== id);
      safeSet(KEYS.folders, JSON.stringify(next));
      return next;
    });
    setNotes(prev => {
      const next = prev.map(n => n.folder === id ? { ...n, folder: null } : n);
      safeSet(KEYS.notes, JSON.stringify(next));
      return next;
    });
    setTasks(prev => {
      const next = prev.map(t => t.folder === id ? { ...t, folder: null } : t);
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });
  }

  function updateFolderColor(id: string, color: string) {
    setFolders(prev => {
      const next = prev.map(f => f.id === id ? { ...f, color } : f);
      safeSet(KEYS.folders, JSON.stringify(next));
      return next;
    });
  }

  function renameFolder(id: string, name: string) {
    setFolders(prev => {
      const next = prev.map(f => f.id === id ? { ...f, name } : f);
      safeSet(KEYS.folders, JSON.stringify(next));
      return next;
    });
  }

  function archiveFolder(id: string, archived: boolean) {
    setFolders(prev => {
      const next = prev.map(f => f.id === id ? { ...f, archived } : f);
      safeSet(KEYS.folders, JSON.stringify(next));
      return next;
    });
    setNotes(prev => {
      const next = prev.map(n => n.folder === id ? { ...n, archived } : n);
      safeSet(KEYS.notes, JSON.stringify(next));
      return next;
    });
    setTasks(prev => {
      const next = prev.map(t => t.folder === id ? { ...t, archived } : t);
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });
  }

  return { addFolder, pinFolder, deleteFolder, updateFolderColor, renameFolder, archiveFolder };
}
