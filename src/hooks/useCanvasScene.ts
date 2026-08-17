import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { CanvasScene } from 'kaori-core';
import { emptyScene, initialSceneState, sceneOf, sceneReducer } from 'kaori-core';
import { asyncCanvasSceneStore } from '@/utils/canvasStorage';

// Long enough that a save lands only once you have actually stopped. A scene is written
// whole, so saving mid-interaction buys nothing: the very next frame invalidates it.
const SAVE_IDLE_MS = 1500;

// Owns one canvas's scene: load it, run kaori-core's reducer over it, and write it back on a
// debounce. The reducer is entirely platform-agnostic — everything this hook adds is the I/O
// around it, which is why it mirrors kaori-desktop/src/hooks/useCanvasScene.ts almost line
// for line with only the store swapped.
export function useCanvasScene(canvasId: string, onSaved?: (id: string) => void) {
  const [state, dispatch] = useReducer(sceneReducer, undefined, () => initialSceneState());
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // The elements and viewport as of the last successful write, held by reference. The reducer
  // never mutates, so "same array" is a sound and O(1) proxy for "nothing changed".
  const savedElementsRef = useRef<CanvasScene['elements'] | null>(null);
  const savedViewportRef = useRef<CanvasScene['viewport'] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<CanvasScene | null>(null);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const write = useCallback(async (id: string, scene: CanvasScene) => {
    try {
      await asyncCanvasSceneStore.put(id, scene);
      savedElementsRef.current = scene.elements;
      savedViewportRef.current = scene.viewport;
      pendingRef.current = null;
      setSaveError(null);
      onSavedRef.current?.(id);
    } catch (err) {
      // Surfaced in the editor header rather than swallowed. asyncCanvasSceneStore rejects
      // instead of warning precisely so this can happen — a silently dropped write loses the
      // drawing itself, and on Android an oversized scene genuinely can be rejected.
      setSaveError(err instanceof Error ? err.message : 'could not save');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    void asyncCanvasSceneStore.get(canvasId).then((scene) => {
      if (cancelled) return;
      const next = scene ?? emptyScene();
      dispatch({ type: 'LOAD', scene: next });
      // LOAD puts these very objects into state, so the freshly loaded scene starts clean.
      savedElementsRef.current = next.elements;
      savedViewportRef.current = next.viewport;
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [canvasId]);

  // Saving waits for the screen to go quiet.
  //
  // Nothing here runs while a gesture is in flight: no scene object is built, no dirty check
  // happens, no timer is set or cleared. A drag or a stroke touches state every frame, and
  // every one of those frames would otherwise do bookkeeping for a write that the next frame
  // supersedes anyway. The gesture *ending* is what makes the scene worth looking at, and the
  // idle delay then waits to be sure you have actually stopped.
  //
  // Dirtiness itself is decided by reference rather than by serializing: the reducer never
  // mutates, so an unchanged elements array is the *same* array.
  const interacting = state.drag !== null || state.textEdit !== null;
  useEffect(() => {
    if (!loaded || interacting) return;
    if (
      state.elements === savedElementsRef.current &&
      state.viewport === savedViewportRef.current
    ) {
      return;
    }
    const scene = sceneOf(state);
    pendingRef.current = scene;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void write(canvasId, scene);
    }, SAVE_IDLE_MS);
    // `state` is read in full to build the scene, but only these two decide whether it is
    // dirty — depending on the whole object would re-run this on every unrelated action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.elements, state.viewport, interacting, loaded, canvasId, write]);

  // Flush on unmount — backing out of the editor mid-debounce would otherwise drop the last
  // few seconds of work. On mobile this matters more than on desktop: the OS can stop the
  // app the moment the screen is popped.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const pending = pendingRef.current;
      if (pending) void asyncCanvasSceneStore.put(canvasId, pending);
    };
  }, [canvasId]);

  // Drops any debounced write without performing it. Needed before deleting a canvas: the
  // unmount flush below would otherwise fire straight after the delete and re-create the
  // scene key as an orphan. The startup prune would eventually collect it, but a delete that
  // leaves data behind until the next launch is not a delete.
  const discardPending = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingRef.current = null;
  }, []);

  return { state, dispatch, loaded, saveError, discardPending };
}
