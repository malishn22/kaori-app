import React, { createContext, useContext, useRef, useState } from 'react';
import GorhomBottomSheet from '@gorhom/bottom-sheet';

type NewNoteSheetContextValue = {
  bottomSheetRef: React.RefObject<GorhomBottomSheet | null>;
  initialProjectId: string | null;
  resetKey: number;
  openNewNote: (projectId?: string) => void;
  closeNewNote: () => void;
};

const NewNoteSheetContext = createContext<NewNoteSheetContextValue | null>(null);

export function NewNoteSheetProvider({ children }: { children: React.ReactNode }) {
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);
  const [initialProjectId, setInitialProjectId] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  function openNewNote(projectId?: string) {
    setInitialProjectId(projectId ?? null);
    setResetKey(k => k + 1);
    bottomSheetRef.current?.expand();
  }

  function closeNewNote() {
    bottomSheetRef.current?.close();
  }

  return (
    <NewNoteSheetContext.Provider value={{ bottomSheetRef, initialProjectId, resetKey, openNewNote, closeNewNote }}>
      {children}
    </NewNoteSheetContext.Provider>
  );
}

export function useNewNoteSheet() {
  const ctx = useContext(NewNoteSheetContext);
  if (!ctx) throw new Error('useNewNoteSheet must be used within NewNoteSheetProvider');
  return ctx;
}
