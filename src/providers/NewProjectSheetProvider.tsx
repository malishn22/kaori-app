import React, { createContext, useContext, useRef } from 'react';
import GorhomBottomSheet from '@gorhom/bottom-sheet';

type NewProjectSheetContextValue = {
  bottomSheetRef: React.RefObject<GorhomBottomSheet | null>;
  openNewProject: () => void;
  closeNewProject: () => void;
};

const NewProjectSheetContext = createContext<NewProjectSheetContextValue | null>(null);

export function NewProjectSheetProvider({ children }: { children: React.ReactNode }) {
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);

  function openNewProject() {
    bottomSheetRef.current?.expand();
  }

  function closeNewProject() {
    bottomSheetRef.current?.close();
  }

  return (
    <NewProjectSheetContext.Provider value={{ bottomSheetRef, openNewProject, closeNewProject }}>
      {children}
    </NewProjectSheetContext.Provider>
  );
}

export function useNewProjectSheet() {
  const ctx = useContext(NewProjectSheetContext);
  if (!ctx) throw new Error('useNewProjectSheet must be used within NewProjectSheetProvider');
  return ctx;
}
