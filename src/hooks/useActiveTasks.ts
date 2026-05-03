import { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';

export function useActiveTasks() {
  const { tasks } = useStore();
  return useMemo(() => tasks.filter(t => !t.archived), [tasks]);
}
