import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput } from 'react-native';
import type { SceneAction, SceneState, TextElement } from 'kaori-core';
import {
  TEXT_LINE_HEIGHT,
  containerOf,
  editingElement,
  labelStrokeFor,
  layoutBoundTextFor,
  layoutText,
  sceneToScreen,
} from 'kaori-core';
import type { SharedValue } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { CANVAS_FONTS, canvasColor } from './colors';
import { measurerFor } from './measureText';

// A real TextInput laid over the SVG, the mobile counterpart of desktop's textarea. A native
// input gets the caret, selection, IME, autocorrect and the on-screen keyboard for free —
// none of which react-native-svg's Text can offer.
//
// Positioned in screen space. Rather than scaling it with a transform, every dimension is
// multiplied by zoom directly: React Native's transform origin support has moved around
// between versions, and scaling the font size renders crisply instead of resampling glyphs.
export function TextOverlay({
  state,
  dispatch,
  surfaceHeight,
  panX,
  panY,
}: {
  state: SceneState;
  dispatch: React.Dispatch<SceneAction>;
  // The canvas's live pan offset. The viewport in state trails the camera by this much between
  // rebases, so every screen position computed here has to add it back or the input sits where
  // the text used to be.
  panX: SharedValue<number>;
  panY: SharedValue<number>;
  // Height of the drawing surface in points, measured by the editor. Needed to work out
  // whether the keyboard has come up over the text being edited.
  surfaceHeight: number;
}) {
  const { colors } = useTheme();
  const el = editingElement(state);
  const [draft, setDraft] = useState('');
  const keyboardHeight = useKeyboardHeight();

  const editingId = el?.id ?? null;
  useEffect(() => {
    if (el && el.kind === 'text') setDraft(el.text);
    // Reset only when the edited element changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  // The shape's height when this edit began — the baseline every live layout is measured
  // against, so the box grows *and* shrinks with the text instead of only ratcheting up.
  // Keyed by element id so re-entering a different label re-captures it.
  const baseRef = useRef<{ id: string; h: number } | null>(null);
  const editedContainerId = el?.kind === 'text' ? (el.containerId ?? null) : null;
  const editedContainerHeight = editedContainerId
    ? (state.elements.find((c) => c.id === editedContainerId)?.h ?? null)
    : null;
  if (el && editedContainerHeight !== null && baseRef.current?.id !== el.id) {
    baseRef.current = { id: el.id, h: editedContainerHeight };
  }

  // Grow the shape as the label is typed rather than waiting for the commit — otherwise the
  // text spills past the border for the whole edit and the box only catches up when you tap
  // away. Computed above the early return because it feeds a hook; dispatched from an effect
  // because the reducer lives in a parent and updating it mid-render is not allowed.
  const editedContainer = el?.kind === 'text' ? containerOf(state.elements, el.id) : null;
  const grownHeight =
    editedContainer && el?.kind === 'text' && baseRef.current
      ? layoutBoundTextFor(
          { ...editedContainer, h: baseRef.current.h },
          { ...el, text: draft },
          measurerFor(el),
        ).containerHeight
      : null;

  useEffect(() => {
    if (!editedContainer || grownHeight === null) return;
    if (grownHeight === editedContainer.h) return;
    dispatch({
      type: 'UPDATE_ELEMENTS_SILENT',
      patches: { [editedContainer.id]: { h: grownHeight } },
    });
  }, [editedContainer, grownHeight, dispatch]);

  // Pan the canvas so the text being edited clears the keyboard.
  //
  // The viewport moves rather than the layout: the surface is a fixed box that the scene is
  // drawn into, so shifting the *camera* keeps the TextInput and the committed glyphs in
  // agreement — resizing the surface instead would move every element under the caret.
  //
  // Applied once per (element, keyboard height) pair. Panning changes the viewport this
  // effect reads, so without the guard it would re-fire on its own result.
  const shiftedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!el || el.kind !== 'text' || keyboardHeight <= 0 || surfaceHeight <= 0) return;
    const key = `${el.id}:${keyboardHeight}:${surfaceHeight}`;
    if (shiftedFor.current === key) return;

    // A brand-new box has no height yet, so fall back to one line.
    const height = el.h || el.fontSize * TEXT_LINE_HEIGHT;
    const screenBottom = (el.y + height - state.viewport.y) * state.viewport.zoom + panY.value;
    const visibleBottom = surfaceHeight - keyboardHeight;
    // A little air below the caret, so the line isn't flush against the keyboard.
    const overlap = screenBottom + 16 - visibleBottom;

    shiftedFor.current = key;
    // Positive dy raises the content: screen = (scene - viewport.y) * zoom, and PAN_BY_SCREEN
    // adds dy/zoom to viewport.y.
    if (overlap > 0) dispatch({ type: 'PAN_BY_SCREEN', dx: 0, dy: overlap });
  }, [el, keyboardHeight, surfaceHeight, state.viewport, dispatch]);

  // Cleared when the edit ends, so the next one is free to shift again.
  useEffect(() => {
    if (!editingId) shiftedFor.current = null;
  }, [editingId]);

  if (!el || el.kind !== 'text') return null;
  const text = el as TextElement;
  const container = containerOf(state.elements, text.id);
  const zoom = state.viewport.zoom;

  // Bound text is laid out against its shape: wrapped at the inner width and shifted for
  // vertical alignment, with the shape growing if the text outruns it. Free text keeps the
  // simpler behaviour — maxWidth 0 means "don't wrap", so the box grows to its longest line
  // and only breaks where the typist pressed return.
  function layoutFor(value: string) {
    if (!container) return null;
    return layoutBoundTextFor(
      // Against the height the shape had when this edit opened, not its current one: the
      // live-growth effect above mutates that height as you type, so laying out against it
      // would ratchet — the box could grow but never shrink back when a line is deleted.
      { ...container, h: baseRef.current?.h ?? container.h },
      { ...text, text: value },
      measurerFor(text),
    );
  }

  function commit(value: string) {
    const bound = layoutFor(value);
    if (bound && container) {
      dispatch({
        type: 'COMMIT_TEXT',
        text: value,
        lines: bound.lines,
        w: bound.w,
        h: bound.h,
        x: bound.x,
        y: bound.y,
        container: { id: container.id, h: bound.containerHeight },
      });
      return;
    }
    const layout = layoutText(value, 0, text.fontSize, measurerFor(text));
    dispatch({ type: 'COMMIT_TEXT', text: value, lines: layout.lines, w: layout.w, h: layout.h });
  }

  // Recomputed from the live draft on every keystroke, so a bound block stays vertically
  // aligned (and the box stays where it will end up) as lines are added and removed.
  const live = layoutFor(draft);
  const measure = measurerFor(text);
  const lines = live ? live.lines : draft.split('\n');
  const widest = lines.reduce((max, line) => Math.max(max, measure(line)), 0);
  const raw = sceneToScreen(state.viewport, live ? live.x : text.x, live ? live.y : text.y);
  const screen = { x: raw.x + panX.value, y: raw.y + panY.value };
  const sceneWidth = live ? live.w : Math.max(widest + text.fontSize * 0.6, text.fontSize * 2);

  return (
    <>
      {/* Tapping the canvas is how an edit is committed, which is what the desktop click-away
          does. SceneView's own gesture refuses to start anything while a text edit is open, so
          this backdrop is what actually receives that tap. An empty commit deletes a brand-new
          box, so tapping away without typing cleanly abandons it. */}
      <Pressable
        className="absolute inset-0"
        onPress={() => commit(draft)}
        accessibilityLabel="finish editing text"
      />
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onBlur={() => commit(draft)}
        autoFocus
        multiline
        // The OS corrections rewrite words after the fact, which would silently change a
        // committed label — and a canvas is not prose.
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        scrollEnabled={false}
        selectionColor={colors.amber}
        style={{
          position: 'absolute',
          left: screen.x,
          top: screen.y,
          width: sceneWidth * zoom,
          height: Math.max(lines.length, 1) * text.fontSize * TEXT_LINE_HEIGHT * zoom,
          fontSize: text.fontSize * zoom,
          lineHeight: text.fontSize * TEXT_LINE_HEIGHT * zoom,
          fontFamily: CANVAS_FONTS[text.fontFamily],
          // The same substitution the committed text uses, so the colour doesn't jump on commit.
          color: canvasColor(labelStrokeFor(text, state.elements) ?? text.stroke, colors),
          // Matches ElementView's textAnchor, so glyphs don't jump when the edit commits.
          textAlign: text.align === 'center' ? 'center' : 'left',
          // Android puts its own padding inside a multiline TextInput; left in, the first line
          // sits lower than the committed text will and everything shifts on commit.
          padding: 0,
          textAlignVertical: 'top',
          includeFontPadding: false,
        }}
      />
    </>
  );
}
