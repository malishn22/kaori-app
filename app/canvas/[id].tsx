import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import type { CanvasTool } from 'kaori-core';
import { useCanvases } from '@/providers/CanvasProvider';
import { useCanvasScene } from '@/hooks/useCanvasScene';
import { useAnimatedPopup } from '@/hooks/useAnimatedPopup';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import { useCanvasPanSpeed } from '@/hooks/useCanvasPanSpeed';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SceneView } from '@/components/canvas/SceneView';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { TextOverlay } from '@/components/canvas/TextOverlay';
import { StylePanel } from '@/components/canvas/StylePanel';
import { PanSpeedSlider } from '@/components/canvas/PanSpeedSlider';
import { RedoIcon, StyleIcon, UndoIcon } from '@/components/canvas/toolIcons';
import { MenuRow, PopupMenu, ThemeText } from '@/components/ui';
import { BackIcon, MoreIcon } from '@/assets/icons';
import { useTheme } from '@/theme';

// The canvas editor. Registered as a route outside (tabs) because the tab bar is absolutely
// positioned and would sit over the drawing surface.
//
// Deliberately not inside a ScrollView: the surface owns its own pan and pinch gestures, and
// a scroll container would take the touches before they ever reach it.
export default function CanvasEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { impact } = useHapticFeedback();
  const { canvases, touchCanvas, renameCanvas, pinCanvas, archiveCanvas, deleteCanvas } =
    useCanvases();

  const canvasId = id ?? '';
  const canvas = canvases.find((c) => c.id === canvasId);

  const [menuOpen, setMenuOpen] = useState(false);
  // Closed by default. The style controls are wanted occasionally; the drawing is wanted
  // always, so the strip is opened from the button on the surface rather than standing there.
  const [styleOpen, setStyleOpen] = useState(false);
  // Measured rather than derived from screen height: the header, the save-error row and the
  // toolbar all take space, and the overlay needs the surface's own box to know when the
  // keyboard is covering the text.
  const [surfaceHeight, setSurfaceHeight] = useState(0);
  const { panSpeed, setPanSpeed } = useCanvasPanSpeed();
  // Owned here so the surface and the text overlay agree on where the camera actually is.
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const { anim: menuAnim, opacity: popupOpacity, open, close } = useAnimatedPopup();

  // Same inline-edit hook the rest of the app uses, so an empty name is rejected rather than
  // committed — a blank title reads as a broken row in the list.
  const rename = useInlineEdit({
    initialValue: canvas?.title ?? '',
    onSave: (title) => void renameCanvas(canvasId, title),
  });

  // Bumps the list's "edited" timestamp, but only when a scene write actually lands — so
  // merely opening a canvas and panning around doesn't reorder the list.
  const onSaved = useCallback(
    (savedId: string) => {
      void touchCanvas(savedId);
    },
    [touchCanvas],
  );

  const { state, dispatch, loaded, saveError, discardPending } = useCanvasScene(canvasId, onSaved);

  const setTool = useCallback(
    (tool: CanvasTool) => dispatch({ type: 'SET_TOOL', tool }),
    [dispatch],
  );

  const closeMenu = useCallback(
    (cb?: () => void) => {
      close(() => {
        setMenuOpen(false);
        cb?.();
      });
    },
    [close],
  );

  // Delete asks twice through the same hook the rest of the app uses: the row relabels itself
  // rather than throwing an alert, and a canvas is not recoverable once its scene key is gone.
  const {
    needsConfirm,
    handlePress: handleDelete,
    reset: resetDelete,
  } = useConfirmAction({
    onConfirm: () => {
      closeMenu(() => {
        // Before the delete, so the hook's unmount flush can't re-create the scene key.
        discardPending();
        void deleteCanvas(canvasId);
        router.back();
      });
    },
    onHaptic: impact,
  });

  // Ids the in-flight eraser sweep has caught, so they can be faded as a preview rather than
  // vanishing before you've committed to losing them.
  const erasing = useMemo(
    () => (state.drag?.kind === 'erase' ? new Set(state.drag.ids) : undefined),
    [state.drag],
  );

  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  return (
    <View className="flex-1 bg-theme-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-4 border-b border-theme-line px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="back">
          <BackIcon size={20} color={colors.ink3} />
        </Pressable>
        {rename.editing ? (
          // Renaming happens in place in the header rather than in a modal: the title is
          // already here, and a sheet for one field is more ceremony than the edit deserves.
          <TextInput
            value={rename.draft}
            onChangeText={rename.setDraft}
            onBlur={rename.commitEdit}
            onSubmitEditing={rename.commitEdit}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            placeholder="untitled"
            placeholderTextColor={colors.ink4}
            className="flex-1"
            style={{ color: colors.ink, fontFamily: 'Geist-Medium', fontSize: 17, padding: 0 }}
          />
        ) : (
          <Pressable className="flex-1" onPress={() => rename.startEditing(canvas?.title ?? '')}>
            <ThemeText variant="title" numberOfLines={1}>
              {canvas?.title || 'untitled'}
            </ThemeText>
          </Pressable>
        )}

        {/* Undo/redo live in the header rather than the tool strip: the strip is full, and
            these are document actions rather than tools. Disabled rather than hidden, so the
            controls don't shift position as history fills up.

            Grouped in their own row so the pair sits tight together and the options menu is
            set well apart from it — undoing an edit and opening a menu of destructive actions
            should not look like three buttons in one set. */}
        <View className="flex-row items-center gap-5">
          <Pressable
            onPress={() => dispatch({ type: 'UNDO' })}
            disabled={!canUndo}
            hitSlop={10}
            accessibilityLabel="undo"
          >
            <UndoIcon size={20} color={canUndo ? colors.ink3 : colors.ink4} />
          </Pressable>
          <Pressable
            onPress={() => dispatch({ type: 'REDO' })}
            disabled={!canRedo}
            hitSlop={10}
            accessibilityLabel="redo"
          >
            <RedoIcon size={20} color={canRedo ? colors.ink3 : colors.ink4} />
          </Pressable>
        </View>

        {/* ml-3 on top of the row's gap-4, so there is a clear 28px break before the menu. */}
        <Pressable
          onPress={() => {
            resetDelete();
            setMenuOpen(true);
            open();
          }}
          hitSlop={10}
          accessibilityLabel="canvas options"
          className="ml-3"
        >
          <MoreIcon size={20} color={colors.ink3} />
        </Pressable>
      </View>

      {/* A write failure gets its own row rather than a corner of the header: the scene store
          rejects instead of warning, and losing a drawing silently is the worst outcome on
          this screen — it deserves the space. */}
      {saveError ? (
        <View className="border-b border-theme-line px-4 py-2">
          <ThemeText variant="meta" color={colors.amber}>
            {saveError}
          </ThemeText>
        </View>
      ) : null}

      {/* Held back until the scene is in: mounting the surface against an empty scene and
          then swapping it would flash a blank canvas over the real drawing.

          The text overlay is a sibling inside this container rather than a child of SceneView,
          because it is a native TextInput positioned in this box's screen coordinates — the
          same box the surface converts touches against, so the two agree on the origin. */}
      <View className="flex-1" onLayout={(e) => setSurfaceHeight(e.nativeEvent.layout.height)}>
        {loaded ? (
          <>
            <SceneView
              state={state}
              dispatch={dispatch}
              erasing={erasing}
              panSpeed={panSpeed}
              panX={panX}
              panY={panY}
            />
            <TextOverlay
              state={state}
              dispatch={dispatch}
              surfaceHeight={surfaceHeight}
              panX={panX}
              panY={panY}
            />
            {/* Bottom-right, over the canvas: within thumb reach, and out of the way of the
                header, which is already carrying four controls. Hidden while typing — the
                keyboard is up and the strip would be behind it. */}
            {/* Floats over the surface, so opening it shifts nothing underneath. */}
            {styleOpen && !state.textEdit ? <StylePanel state={state} dispatch={dispatch} /> : null}
            {!state.textEdit && (
              <Pressable
                onPress={() => setStyleOpen((v) => !v)}
                accessibilityLabel={styleOpen ? 'hide style controls' : 'show style controls'}
                accessibilityState={{ expanded: styleOpen }}
                className="absolute bottom-4 right-4 items-center justify-center rounded-full border border-theme-line"
                style={{
                  width: 42,
                  height: 42,
                  backgroundColor: styleOpen ? colors.paper2 : colors.paper,
                }}
              >
                <StyleIcon size={20} color={styleOpen ? colors.amber : colors.ink3} />
              </Pressable>
            )}
          </>
        ) : null}
      </View>

      <CanvasToolbar tool={state.tool} onSelect={setTool} />

      <PopupMenu
        visible={menuOpen}
        onClose={() => closeMenu()}
        anim={menuAnim}
        opacity={popupOpacity}
        anchor="top-right"
        top={insets.top + 52}
      >
        <MenuRow
          label="rename"
          onPress={() => closeMenu(() => rename.startEditing(canvas?.title ?? ''))}
        />
        {/* Revealed in place rather than behind another screen — you want to feel the change
            on the canvas, which means keeping the canvas visible while you drag. */}
        <PanSpeedSlider value={panSpeed} onChange={setPanSpeed} />
        <MenuRow
          label={canvas?.pinned ? 'unpin' : 'pin'}
          right={
            canvas?.pinned ? (
              <ThemeText variant="meta" color="amber">
                pinned
              </ThemeText>
            ) : undefined
          }
          onPress={() => closeMenu(() => void pinCanvas(canvasId, !canvas?.pinned))}
        />
        <MenuRow
          label={canvas?.archived ? 'unarchive' : 'archive'}
          // Archiving leaves the editor: the canvas is no longer in the list you came from,
          // so staying on a screen for something you just filed away reads as a dead end.
          onPress={() =>
            closeMenu(() => {
              void archiveCanvas(canvasId, !canvas?.archived);
              router.back();
            })
          }
        />
        <MenuRow
          label={needsConfirm ? 'tap again to delete' : 'delete'}
          labelColor={needsConfirm ? 'amber' : 'ink2'}
          borderBottom={false}
          onPress={handleDelete}
        />
      </PopupMenu>
    </View>
  );
}
