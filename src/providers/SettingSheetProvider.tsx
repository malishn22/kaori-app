import React, { createContext, useContext, useState } from 'react';

type SheetKey = 'tone' | 'accent' | 'folder' | null;

type SettingSheetContextValue = {
  openSheet: SheetKey;
  setOpenSheet: (key: SheetKey) => void;
};

const SettingSheetContext = createContext<SettingSheetContextValue>({
  openSheet: null,
  setOpenSheet: () => {},
});

export function SettingSheetProvider({ children }: { children: React.ReactNode }) {
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);
  return (
    <SettingSheetContext.Provider value={{ openSheet, setOpenSheet }}>
      {children}
    </SettingSheetContext.Provider>
  );
}

export function useSettingSheet() {
  return useContext(SettingSheetContext);
}
