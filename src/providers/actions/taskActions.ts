import type { Task, Folder } from '@/types';
import { safeSet } from '@/utils/storage';
import { KEYS } from '@/utils/migration';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function createTaskActions(
  setTasks: SetState<Task[]>,
  setFolders: SetState<Folder[]>,
) {
  function addTask(title: string, body: string, dueDate: string | null, folderId: string | null) {
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

    setTasks(prev => {
      const next = [newTask, ...prev];
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });

    if (folderId) {
      setFolders(prev => {
        const next = prev.map(f => f.id !== folderId ? f : { ...f, updated: new Date().toISOString() });
        safeSet(KEYS.folders, JSON.stringify(next));
        return next;
      });
    }
  }

  function updateTask(id: string, patch: Partial<Pick<Task, 'title' | 'body' | 'dueDate' | 'folder' | 'pinned' | 'done'>>) {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...patch } : t);
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });
  }

  function toggleTask(id: string) {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, done: !t.done, archived: !t.done } : t);
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });
  }

  function deleteTask(id: string) {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });
  }

  function archiveTask(id: string, archived: boolean) {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, archived, ...(!archived && { done: false }) } : t);
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });
  }

  function pinTask(id: string, pinned: boolean) {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, pinned } : t);
      safeSet(KEYS.tasks, JSON.stringify(next));
      return next;
    });
  }

  return { addTask, updateTask, toggleTask, deleteTask, archiveTask, pinTask };
}
