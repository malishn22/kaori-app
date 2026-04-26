import { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { MS_PER_DAY } from '@/constants';

export function useProjectNotes(projectId: string) {
  const { notes: allNotes, projects } = useStore();

  return useMemo(() => {
    const proj = projects.find(p => p.id === projectId);

    if (!proj) {
      return { proj: undefined as undefined, notes: [] as typeof allNotes, notesThisWeek: 0, pinnedCount: 0 };
    }

    const notes = allNotes.filter(n => n.project === proj.id);
    const now = Date.now();
    const notesThisWeek = notes.filter(n => (now - new Date(n.createdAt).getTime()) < 7 * MS_PER_DAY).length;
    const pinnedCount = notes.filter(n => n.pinned).length;

    return { proj, notes, notesThisWeek, pinnedCount };
  }, [allNotes, projects, projectId]);
}
