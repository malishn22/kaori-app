import { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';

export function useProjectTasks(projectId: string) {
  const { tasks: allTasks, projects } = useStore();

  return useMemo(() => {
    const proj = projects.find(p => p.id === projectId);

    if (!proj) {
      return { proj: undefined as undefined, tasks: [] as typeof allTasks, openCount: 0, doneCount: 0 };
    }

    const tasks = allTasks.filter(t => t.project === proj.id && !t.archived && !t.done);
    const openCount = tasks.filter(t => !t.done).length;
    const doneCount = tasks.filter(t => t.done).length;

    return { proj, tasks, openCount, doneCount };
  }, [allTasks, projects, projectId]);
}
