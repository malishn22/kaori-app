import type { Task, Folder } from '@/types';
import { safeSet } from '@/utils/storage';
import { KEYS } from '@/utils/migration';
import { resolveNoteLinks, extractUrls } from '@/utils/links';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function createTaskActions(
  setTasks: SetState<Task[]>,
  setFolders: SetState<Folder[]>,
) {
  function addTask(
    title: string,
    dueDate: string | null,
    folderId: string | null,
    reminderAt?: string | null,
    links: Record<string, string> = {},
  ) {
    const createdAt = new Date().toISOString();
    const taskId = Date.now().toString();
    const newTask: Task = {
      id: taskId,
      folder: folderId,
      title,
      dueDate,
      ...(reminderAt != null && { reminderAt }),
      done: false,
      createdAt,
      pinned: false,
      links,
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

    if (extractUrls(title).length > 0) {
      resolveNoteLinks(title, links).then((resolved) => {
        setTasks(prev => {
          const next = prev.map(t => t.id === taskId ? { ...t, links: { ...resolved, ...links } } : t);
          safeSet(KEYS.tasks, JSON.stringify(next));
          return next;
        });
      });
    }
  }

  function updateTask(id: string, patch: Partial<Pick<Task, 'title' | 'dueDate' | 'reminderAt' | 'folder' | 'pinned' | 'done' | 'links'>>) {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...patch } : t);
      safeSet(KEYS.tasks, JSON.stringify(next));

      if (patch.title && extractUrls(patch.title).length > 0) {
        const existing = next.find(t => t.id === id);
        const mergedExisting = { ...existing?.links };
        resolveNoteLinks(patch.title, mergedExisting).then((resolved) => {
          setTasks(inner => {
            const updated = inner.map(t => {
              if (t.id !== id) return t;
              return { ...t, links: { ...resolved, ...(patch.links ?? {}) } };
            });
            safeSet(KEYS.tasks, JSON.stringify(updated));
            return updated;
          });
        });
      }

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
