import { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { MS_PER_DAY } from '@/constants';

export function useFolderNotes(folderId: string) {
  const { notes: allNotes, folders } = useStore();

  return useMemo(() => {
    const folder = folders.find(f => f.id === folderId);

    if (!folder) {
      return { folder: undefined as undefined, notes: [] as typeof allNotes, notesThisWeek: 0, pinnedCount: 0 };
    }

    const notes = allNotes.filter(n => n.folder === folder.id && !n.archived);
    const now = Date.now();
    const notesThisWeek = notes.filter(n => (now - new Date(n.createdAt).getTime()) < 7 * MS_PER_DAY).length;
    const pinnedCount = notes.filter(n => n.pinned).length;

    return { folder, notes, notesThisWeek, pinnedCount };
  }, [allNotes, folders, folderId]);
}
