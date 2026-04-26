import { useStore } from '@/providers/StoreProvider';

export function useProjectIdeas(projectId: string) {
  const { ideas: allIdeas, projects } = useStore();
  const proj = projects.find(p => p.id === projectId);

  if (!proj) {
    return { proj: undefined, ideas: [], ideasThisWeek: 0, pinnedCount: 0 };
  }

  const ideas = allIdeas.filter(i => i.project === proj.id);
  const now = Date.now();
  const ideasThisWeek = ideas.filter(i => (now - new Date(i.createdAt).getTime()) < 7 * 86400000).length;
  const pinnedCount = ideas.filter(i => i.pinned).length;

  return { proj, ideas, ideasThisWeek, pinnedCount };
}
