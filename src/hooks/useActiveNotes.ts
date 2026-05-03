import { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';

export function useActiveNotes() {
  const { notes } = useStore();
  return useMemo(() => notes.filter(n => !n.archived), [notes]);
}
