import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Canvas } from 'kaori-core';
import { createCanvasActions } from 'kaori-core';
import {
  asyncCanvasSceneStore,
  loadCanvases,
  pruneOrphanedCanvasData,
  saveCanvases,
} from '@/utils/canvasStorage';

// Canvases live in their own provider rather than inside StoreProvider. That store loads
// every entity up front and rewrites a whole collection on any change — the right shape
// for notes and tasks, and the wrong one for documents that are large, opened one at a
// time, and saved on a debounce while drawing.

// A StorageAdapter over the metadata array, so kaori-core's shared action creators work
// here exactly as they do on desktop over SQLite.
function metadataAdapter(read: () => Canvas[], write: (next: Canvas[]) => void) {
  return {
    async list() {
      return read();
    },
    async create(canvas: Canvas) {
      write([...read(), canvas]);
    },
    async update(id: string, patch: Partial<Canvas>) {
      write(read().map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    async remove(id: string) {
      write(read().filter((c) => c.id !== id));
    },
  };
}

type CanvasContextValue = {
  canvases: Canvas[];
  loaded: boolean;
  addCanvas: (title: string) => Promise<Canvas>;
  renameCanvas: (id: string, title: string) => Promise<void>;
  touchCanvas: (id: string) => Promise<void>;
  deleteCanvas: (id: string) => Promise<void>;
  archiveCanvas: (id: string, archived: boolean) => Promise<void>;
  pinCanvas: (id: string, pinned: boolean) => Promise<void>;
};

const CanvasContext = createContext<CanvasContextValue | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loaded, setLoaded] = useState(false);

  // The list is held in state and mirrored to storage, so actions can read the current
  // value synchronously while the write happens behind them.
  const currentRef = React.useRef<Canvas[]>([]);
  currentRef.current = canvases;

  const write = useCallback((next: Canvas[]) => {
    currentRef.current = next;
    setCanvases(next);
    void saveCanvases(next);
  }, []);

  const actions = React.useMemo(
    () =>
      createCanvasActions(
        metadataAdapter(() => currentRef.current, write),
        asyncCanvasSceneStore,
      ),
    [write],
  );

  useEffect(() => {
    void loadCanvases().then((list) => {
      currentRef.current = list;
      setCanvases(list);
      setLoaded(true);
      // Startup is the one moment no editor can be open, which is what makes collecting
      // orphaned scenes and images safe here — the check reads persisted state, and the
      // editor saves on a debounce.
      void pruneOrphanedCanvasData(list).catch(() => {
        // Reclaiming space is never worth interrupting a launch over.
      });
    });
  }, []);

  const value: CanvasContextValue = {
    canvases,
    loaded,
    addCanvas: useCallback((title: string) => actions.addCanvas(title, null), [actions]),
    renameCanvas: useCallback((id, title) => actions.updateCanvas(id, { title }), [actions]),
    touchCanvas: useCallback((id) => actions.touchCanvas(id), [actions]),
    deleteCanvas: useCallback((id) => actions.deleteCanvas(id), [actions]),
    archiveCanvas: useCallback((id, archived) => actions.archiveCanvas(id, archived), [actions]),
    pinCanvas: useCallback((id, pinned) => actions.pinCanvas(id, pinned), [actions]),
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvases(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvases must be used within CanvasProvider');
  return ctx;
}
