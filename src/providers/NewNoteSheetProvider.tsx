import React, { createContext, useContext, useRef, useState } from 'react';
import GorhomBottomSheet from '@gorhom/bottom-sheet';

type NewNoteSheetContextValue = {
  bottomSheetRef: React.RefObject<GorhomBottomSheet | null>;
  initialProjectId: string | null;
  openNewNote: (projectId?: string) => void;
  closeNewNote: () => void;
};

const NewNoteSheetContext = createContext<NewNoteSheetContextValue | null>(null);

export function NewNoteSheetProvider({ children }: { children: React.ReactNode }) {
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);
  const [initialProjectId, setInitialProjectId] = useState<string | null>(null);

  function openNewNote(projectId?: string) {
    setInitialProjectId(projectId ?? null);
    bottomSheetRef.current?.expand();
  }

  function closeNewNote() {
    bottomSheetRef.current?.close();
  }

  return (
    <NewNoteSheetContext.Provider value={{ bottomSheetRef, initialProjectId, openNewNote, closeNewNote }}>
      {children}
    </NewNoteSheetContext.Provider>
  );
}

export function useNewNoteSheet() {
  const ctx = useContext(NewNoteSheetContext);
  if (!ctx) throw new Error('useNewNoteSheet must be used within NewNoteSheetProvider');
  return ctx;
}
