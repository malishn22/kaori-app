import type { Task, Folder } from '@/types';
import { safeSet, safeMultiSet } from '@/utils/storage';
import { KEYS } from '@/utils/migration';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function createTaskActions(
  tasks: Task[],
  setTasks: SetState<Task[]>,
  folders: Folder[],
  setFolders: SetState<Folder[]>,
) {
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
    await safeMultiSet([
      [KEYS.tasks, JSON.stringify(nextTasks)],
      [KEYS.folders, JSON.stringify(nextFolders)],
    ]);
  }

  async function updateTask(id: string, patch: Partial<Pick<Task, 'title' | 'body' | 'dueDate' | 'folder' | 'pinned' | 'done'>>) {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, ...patch } : t);
    setTasks(nextTasks);
    await safeSet(KEYS.tasks, JSON.stringify(nextTasks));
  }

  async function toggleTask(id: string) {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done, archived: !t.done } : t);
    setTasks(nextTasks);
    await safeSet(KEYS.tasks, JSON.stringify(nextTasks));
  }

  async function deleteTask(id: string) {
    const nextTasks = tasks.filter(t => t.id !== id);
    setTasks(nextTasks);
    await safeSet(KEYS.tasks, JSON.stringify(nextTasks));
  }

  async function archiveTask(id: string, archived: boolean) {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, archived } : t);
    setTasks(nextTasks);
    await safeSet(KEYS.tasks, JSON.stringify(nextTasks));
  }

  async function pinTask(id: string, pinned: boolean) {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, pinned } : t);
    setTasks(nextTasks);
    await safeSet(KEYS.tasks, JSON.stringify(nextTasks));
  }

  return { addTask, updateTask, toggleTask, deleteTask, archiveTask, pinTask };
}
