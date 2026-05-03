import { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';

export function useFolderTasks(folderId: string) {
  const { tasks: allTasks, folders } = useStore();

  return useMemo(() => {
    const folder = folders.find(f => f.id === folderId);

    if (!folder) {
      return { folder: undefined as undefined, tasks: [] as typeof allTasks, openCount: 0, doneCount: 0 };
    }

    const tasks = allTasks.filter(t => t.folder === folder.id && !t.archived && !t.done);
    const openCount = tasks.filter(t => !t.done).length;
    const doneCount = tasks.filter(t => t.done).length;

    return { folder, tasks, openCount, doneCount };
  }, [allTasks, folders, folderId]);
}
