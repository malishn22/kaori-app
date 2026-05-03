import { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';

export function useActiveFolders() {
  const { folders } = useStore();
  return useMemo(() => folders.filter(f => !f.archived), [folders]);
}
