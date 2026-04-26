import React, { createContext, useContext, useRef, useState } from 'react';
import GorhomBottomSheet from '@gorhom/bottom-sheet';

type ProjectMenuSheetContextValue = {
  bottomSheetRef: React.RefObject<GorhomBottomSheet | null>;
  activeProjectId: string | null;
  openProjectMenu: (projectId: string, onDelete?: () => void) => void;
  closeProjectMenu: () => void;
  onDeleteCallback: React.MutableRefObject<(() => void) | undefined>;
};

const ProjectMenuSheetContext = createContext<ProjectMenuSheetContextValue | null>(null);

export function ProjectMenuSheetProvider({ children }: { children: React.ReactNode }) {
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const onDeleteCallback = useRef<(() => void) | undefined>(undefined);

  function openProjectMenu(projectId: string, onDelete?: () => void) {
    onDeleteCallback.current = onDelete;
    setActiveProjectId(projectId);
    bottomSheetRef.current?.expand();
  }

  function closeProjectMenu() {
    bottomSheetRef.current?.close();
  }

  return (
    <ProjectMenuSheetContext.Provider value={{ bottomSheetRef, activeProjectId, openProjectMenu, closeProjectMenu, onDeleteCallback }}>
      {children}
    </ProjectMenuSheetContext.Provider>
  );
}

export function useProjectMenuSheet() {
  const ctx = useContext(ProjectMenuSheetContext);
  if (!ctx) throw new Error('useProjectMenuSheet must be used within ProjectMenuSheetProvider');
  return ctx;
}
