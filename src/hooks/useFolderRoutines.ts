import { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';

export function useFolderRoutines(folderId: string) {
  const { routines: allRoutines, folders } = useStore();

  return useMemo(() => {
    const folder = folders.find((f) => f.id === folderId);

    if (!folder) {
      return {
        folder: undefined as undefined,
        routines: [] as typeof allRoutines,
        activeCount: 0,
        pausedCount: 0,
      };
    }

    const routines = allRoutines.filter((r) => r.folder === folder.id && !r.archived);
    const activeCount = routines.filter((r) => r.active).length;
    const pausedCount = routines.filter((r) => !r.active).length;

    return { folder, routines, activeCount, pausedCount };
  }, [allRoutines, folders, folderId]);
}
