import { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';

export function useActiveRoutines() {
  const { routines } = useStore();
  return useMemo(() => routines.filter((r) => !r.archived), [routines]);
}
