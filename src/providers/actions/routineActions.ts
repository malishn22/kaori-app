import type { Routine, Folder } from '@/types';
import { safeSet } from '@/utils/storage';
import { KEYS } from '@/utils/migration';
import { dateKey } from '@/utils/time';
import { resolveLinksFor } from './resolveLinksFor';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function createRoutineActions(
  setRoutines: SetState<Routine[]>,
  setFolders: SetState<Folder[]>,
) {
  function addRoutine(
    id: string,
    title: string,
    daysOfWeek: number[],
    reminderTime: string | null,
    folderId: string | null,
    links: Record<string, string> = {},
  ) {
    const createdAt = new Date().toISOString();
    const newRoutine: Routine = {
      id,
      folder: folderId,
      title,
      daysOfWeek,
      reminderTime,
      active: true,
      createdAt,
      pinned: false,
      completions: {},
      links,
    };

    setRoutines((prev) => {
      const next = [newRoutine, ...prev];
      safeSet(KEYS.routines, JSON.stringify(next));
      return next;
    });

    if (folderId) {
      setFolders((prev) => {
        const next = prev.map((f) =>
          f.id !== folderId ? f : { ...f, updated: new Date().toISOString() },
        );
        safeSet(KEYS.folders, JSON.stringify(next));
        return next;
      });
    }

    resolveLinksFor(setRoutines, KEYS.routines, id, title, links);
  }

  function updateRoutine(
    id: string,
    patch: Partial<
      Pick<
        Routine,
        'title' | 'daysOfWeek' | 'reminderTime' | 'folder' | 'pinned' | 'active' | 'links'
      >
    >,
  ) {
    setRoutines((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      safeSet(KEYS.routines, JSON.stringify(next));

      if (patch.title) {
        const updated = next.find((r) => r.id === id);
        resolveLinksFor(setRoutines, KEYS.routines, id, patch.title, { ...updated?.links });
      }

      return next;
    });
  }

  function toggleRoutineDone(id: string, date: Date = new Date()) {
    const key = dateKey(date);
    setRoutines((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, completions: { ...r.completions, [key]: !r.completions[key] } } : r,
      );
      safeSet(KEYS.routines, JSON.stringify(next));
      return next;
    });
  }

  function deleteRoutine(id: string) {
    setRoutines((prev) => {
      const next = prev.filter((r) => r.id !== id);
      safeSet(KEYS.routines, JSON.stringify(next));
      return next;
    });
  }

  function archiveRoutine(id: string, archived: boolean) {
    setRoutines((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, archived } : r));
      safeSet(KEYS.routines, JSON.stringify(next));
      return next;
    });
  }

  function pinRoutine(id: string, pinned: boolean) {
    setRoutines((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, pinned } : r));
      safeSet(KEYS.routines, JSON.stringify(next));
      return next;
    });
  }

  return {
    addRoutine,
    updateRoutine,
    toggleRoutineDone,
    deleteRoutine,
    archiveRoutine,
    pinRoutine,
  };
}
