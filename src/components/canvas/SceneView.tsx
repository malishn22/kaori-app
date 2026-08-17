import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Pattern, Rect, Text as SvgText } from 'react-native-svg';
import type { SceneAction, SceneState } from 'kaori-core';
import {
  hitTestTopmost,
  hitToleranceAt,
  isBoundText,
  isContainer,
  isFrame,
  labelStrokeFor,
  rotationFrameOf,
  screenToScene,
  visibleElements,
} from 'kaori-core';
import { useTheme } from '@/theme';
import { ElementView } from './ElementView';
import { SelectionFrame } from './SelectionFrame';

// Returns the previous array whenever every member is reference-equal to it.
//
// The reducer never mutates, so an element that was not touched is the *same object* in the
// next state — but `state.elements` is a fresh array on every frame of a drag, and that alone
// is enough to invalidate any memo keyed on it. This restores the identity that the immutable
// update already earns, which is what keeps the untouched part of the scene off the per-frame
// render path.
function useStableList<T>(list: T[]): T[] {
  const previous = useRef<T[]>(list);
  const same =
    previous.current.length === list.length && previous.current.every((el, i) => el === list[i]);
  if (!same) previous.current = list;
  return previous.current;
}

// Everything that is part of the drawing: the dot grid, frames and their clip regions, and
// the elements themselves. The mobile counterpart of kaori-desktop's SceneLayer, plus the
// viewport gestures — on desktop those come from wheel/trackpad events on the surface.

// The dot grid is drawn as one big rectangle inside the panned group, rather than a
// screen-filling one outside it, so it travels with the scene. Half-extent in screen points;
// it only has to outrun how far you can pan before letting go.
const GRID_SPAN = 6000;

// How far the drawn surface extends past the visible box, and how far the live pan offset may
// grow before the scene is re-rendered around the new camera position. The surface is what
// moves during a pan, so it has to have somewhere to move from.
const OVERDRAW = 320;
// The offset is folded back into the viewport only when it gets close to the drawn edge.
//
// Every fold risks a visible frame, so the only reliable lever is to make folds rare. Folding
// when the finger lifts was tried and is much worse: it turns "rare and occasional" into "every
// single pan".
const REBASE_AT = 260;

// Dot-grid spacing in scene units, doubled/halved until a tile lands in a comfortable
// screen-pixel range. A fixed scene spacing turns into either a solid wash at low zoom or
// four visible dots at high zoom.
function gridStep(zoom: number): number {
  let step = 28;
  while (step * zoom < 18) step *= 2;
  while (step * zoom > 56) step /= 2;
  return step;
}

export function SceneView({
  state,
  dispatch,
  erasing,
  imageUrls,
  panSpeed = 1,
  panX,
  panY,
}: {
  state: SceneState;
  dispatch: React.Dispatch<SceneAction>;
  // Ids the in-flight eraser sweep has touched, faded as a preview.
  erasing?: Set<string>;
  imageUrls?: Map<string, string>;
  // Multiplier on every pan delta.
  panSpeed?: number;
  // The live pan offset in screen points, owned by the editor so the text overlay can apply it
  // too — while it is non-zero the viewport in state is behind the camera by exactly this much.
  panX: SharedValue<number>;
  panY: SharedValue<number>;
}) {
  const { colors } = useTheme();
  const { viewport } = state;

  // ── Panning runs on the UI thread ───────────────────────────────────────────
  // The scene is translated by a Reanimated transform while a pan is in flight, and the
  // viewport is only told about it when the gesture ends.
  //
  // Dispatching every frame meant a JS round-trip and a React render per frame, which is a
  // budget no phone meets — and the faster you pan, the further apart the frames land, which
  // is exactly the stutter that gets worse with the speed slider turned up. A shared value
  // updated inside the worklet never leaves the UI thread, so the drag tracks the finger at
  // display rate no matter what JS is doing.
  const tx = panX;
  const ty = panY;
  // 1 once the JS side has decided this one-finger drag is a pan. Set through runOnJS from
  // toolDown, so the first frame or two may arrive before it flips — those fall through to the
  // JS path below, which pans correctly too, just slowly. No movement is lost either way.
  const panActive = useSharedValue(0);

  // The *scene group* is translated, not the surface it is drawn on.
  //
  // Translating the whole rasterised view was cheap to composite, but moving a surface exposes
  // its edges — which is the entire reason overdraw existed, and the reason the camera had to be
  // re-based before an edge showed. A re-base is a fold: React state and this shared value both
  // change to describe one position, and they cannot land on the same frame. That was the last
  // one-frame slip.
  //
  // Transforming the content inside a stationary surface exposes no edge, so there is no window
  // to run out of, no re-base, and therefore no fold left anywhere in panning.
  const panStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  // Folded back only when the offset approaches the drawn edge — see rebase.
  const pendingCommit = useRef(false);
  const rebasedByRef = useRef({ x: 0, y: 0 });
  const rebasing = useSharedValue(0);
  const rebase = useCallback(
    (dx: number, dy: number) => {
      pendingCommit.current = true;
      rebasedByRef.current = { x: dx, y: dy };
      dispatch({ type: 'PAN_BY_SCREEN', dx: -dx, dy: -dy });
    },
    [dispatch],
  );
  useLayoutEffect(() => {
    if (!pendingCommit.current) return;
    pendingCommit.current = false;
    tx.value -= rebasedByRef.current.x;
    ty.value -= rebasedByRef.current.y;
    rebasing.value = 0;
  }, [viewport.x, viewport.y, tx, ty, rebasing]);

  // The offset is folded back only at a rebase. Lifting your finger changes nothing at
  // all — no dispatch, no re-render — and there is no threshold that ever forces one, so there
  // is no moment where the two threads could disagree. The viewport in state stays the base the
  // canvas was opened at; everything on the JS side reads through toScene below.

  // Everything the JS side converts has to account for the live offset, since the viewport in
  // state is behind by exactly that much. Reading a shared value from JS is allowed, and these
  // are all event handlers rather than render paths.
  const toScene = useCallback(
    (sx: number, sy: number) => screenToScene(viewport, sx - tx.value, sy - ty.value),
    [viewport, tx, ty],
  );

  // Pinch reports cumulative scale since the gesture began, but zoomAt wants an incremental
  // factor, so the previous value is held here and divided out. Kept on the JS thread
  // alongside the dispatch rather than in a shared value — see the note on the gestures below.
  const lastScale = useRef(1);
  const beginPinch = useCallback(() => {
    lastScale.current = 1;
  }, []);
  const pinchTo = useCallback(
    (scale: number, focalX: number, focalY: number) => {
      const factor = scale / (lastScale.current || 1);
      lastScale.current = scale;
      dispatch({ type: 'ZOOM_AT', screen: { x: focalX, y: focalY }, factor });
    },
    [dispatch],
  );

  // Two-finger pan and pinch are always live, whatever the tool — the same rule as
  // Excalidraw, and what keeps navigating the canvas from ever being modal. One finger is
  // reserved for the active tool, so it pans only under the hand tool.
  //
  // Neither touches JS while the finger is down, and neither tells the viewport afterwards:
  // they only move the shared values the scene group is transformed by.
  //
  // onChange rather than onUpdate: onChange carries per-frame deltas (changeX/changeY), while
  // onUpdate reports the translation accumulated since the gesture began — feeding that in
  // would compound.
  //
  const twoFingerPan = Gesture.Pan()
    .minPointers(2)
    .averageTouches(true)
    .onStart(() => {
      'worklet';
      // Takes ownership from the one-finger path if a second finger joins mid-drag, so the
      // tool gesture below won't also claim the offset.
      panActive.value = 0;
    })
    .onChange((e) => {
      'worklet';
      tx.value += e.changeX * panSpeed;
      ty.value += e.changeY * panSpeed;
      if (
        rebasing.value === 0 &&
        (Math.abs(tx.value) > REBASE_AT || Math.abs(ty.value) > REBASE_AT)
      ) {
        rebasing.value = 1;
        runOnJS(rebase)(tx.value, ty.value);
      }
    });

  const oneFingerPan = Gesture.Pan()
    .maxPointers(1)
    .enabled(state.tool === 'hand')
    .onChange((e) => {
      'worklet';
      tx.value += e.changeX * panSpeed;
      ty.value += e.changeY * panSpeed;
      if (
        rebasing.value === 0 &&
        (Math.abs(tx.value) > REBASE_AT || Math.abs(ty.value) > REBASE_AT)
      ) {
        rebasing.value = 1;
        runOnJS(rebase)(tx.value, ty.value);
      }
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      runOnJS(beginPinch)();
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(pinchTo)(e.scale, e.focalX, e.focalY);
    });

  // ── The active tool's own gesture ────────────────────────────────────────────
  // Everything that decides *what* a one-finger drag does lives in kaori-core's reducer;
  // this only converts touch coordinates into scene points, exactly as the desktop pointer
  // hook does.
  // Set when a one-finger drag is panning rather than acting on the scene: the select tool
  // over empty canvas. `moved` tracks whether it turned into an actual drag, so a tap can
  // still clear the selection.
  // Records where the live offset stood when this drag began, so a tap can be told from a drag
  // without any of the pan frames having reached JS.
  const panDrag = useRef<{ fromX: number; fromY: number } | null>(null);

  const toolDown = useCallback(
    (sx: number, sy: number) => {
      const point = toScene(sx, sy);
      // Tapping away from an open text box commits it and does nothing else — the same rule
      // as desktop. The overlay owns the commit; this just refuses to start a second gesture
      // underneath it.
      if (state.textEdit) return;
      // The text tool aimed at a shape puts the text *inside* it rather than dropping a free
      // label on top of it.
      if (state.tool === 'text') {
        const target = hitTestTopmost(state.elements, point, hitToleranceAt(viewport.zoom));
        if (target && isContainer(target)) {
          dispatch({ type: 'BEGIN_CONTAINER_TEXT', containerId: target.id });
          return;
        }
      }
      // With the select tool, a drag that starts on empty canvas moves the *canvas*. On a
      // phone getting around matters more than rubber-band selection, and the tool you reach
      // for by default should not require switching to the hand first.
      //
      // Starting on an element still moves that element, and a tap still selects, so nothing
      // about direct manipulation changes.
      if (state.tool === 'select') {
        const hit = hitTestTopmost(state.elements, point, hitToleranceAt(viewport.zoom));
        if (!hit) {
          panDrag.current = { fromX: tx.value, fromY: ty.value };
          panActive.value = 1;
          return;
        }
      }

      dispatch({ type: 'POINTER_DOWN', point });
    },
    [dispatch, panActive, state.elements, state.textEdit, state.tool, toScene, tx, ty, viewport],
  );

  // Takes the gesture's own per-frame deltas rather than differencing against a stored
  // anchor. An anchor captured at touch-down is only correct if updates start flowing
  // immediately — if anything delays activation, the first update carries every pixel moved
  // since then and the canvas lurches to catch up.
  const toolMove = useCallback(
    (sx: number, sy: number, dx: number, dy: number) => {
      // The frame or two that arrive before panActive flips land here. They feed the same
      // shared offset rather than dispatching, so there is only ever one representation of
      // where the camera is — a second mechanism would have to be reconciled with this one.
      if (panDrag.current) {
        tx.value += dx * panSpeed;
        ty.value += dy * panSpeed;
        return;
      }
      dispatch({ type: 'POINTER_MOVE', point: toScene(sx, sy) });
    },
    [dispatch, panSpeed, toScene, tx, ty],
  );

  const toolUp = useCallback(
    (dx: number, dy: number, owned: boolean) => {
      const panning = panDrag.current;
      panDrag.current = null;
      if (panning) {
        // A pan never sent POINTER_DOWN, so it must not send POINTER_UP either — the reducer
        // has no drag to close and would just be handed an event out of nowhere. There is also
        // nothing to commit: the offset stays live, which is what removes the hitch on release.
        //
        // `owned` is false when a two-finger pan took over mid-drag.
        if (!owned) return;
        // Compared against where the offset stood when this gesture began, since none of its
        // frames reached JS. Barely any movement means it was a tap, and a tap on empty canvas
        // clears the selection.
        const movement = Math.abs(dx - panning.fromX) + Math.abs(dy - panning.fromY);
        if (movement < 2) {
          dispatch({ type: 'SELECT', ids: [] });
          return;
        }
        return;
      }
      dispatch({ type: 'POINTER_UP' });
    },
    [dispatch],
  );

  // minDistance(0) so the gesture activates the instant a finger lands: a tap has to reach
  // the reducer as a down/up pair, which is how selection works. The default threshold would
  // swallow taps entirely and only ever report drags.
  //
  // maxPointers(1) hands two-finger gestures to the pan/pinch pair above. Known rough edge:
  // if a second finger lands mid-stroke this gesture is cancelled and onFinalize still sends
  // POINTER_UP, which commits whatever short stroke was drawn. Cancelling cleanly needs a
  // discard action in core's reducer, which POINTER_UP is currently the only terminator for.
  const toolGesture = Gesture.Pan()
    .maxPointers(1)
    .minDistance(0)
    .enabled(state.tool !== 'hand')
    .onBegin((e) => {
      'worklet';
      runOnJS(toolDown)(e.x, e.y);
    })
    .onChange((e) => {
      'worklet';
      if (panActive.value === 1) {
        tx.value += e.changeX * panSpeed;
        ty.value += e.changeY * panSpeed;
        if (
          rebasing.value === 0 &&
          (Math.abs(tx.value) > REBASE_AT || Math.abs(ty.value) > REBASE_AT)
        ) {
          rebasing.value = 1;
          runOnJS(rebase)(tx.value, ty.value);
        }
        return;
      }
      runOnJS(toolMove)(e.x, e.y, e.changeX, e.changeY);
    })
    .onFinalize(() => {
      'worklet';
      // Cleared here, on the UI thread, so that whoever finalises second sees 0 and cannot
      // commit the same translation again. onFinalize (not onEnd) because a cancelled drag
      // still has to send POINTER_UP.
      const owned = panActive.value === 1;
      panActive.value = 0;
      runOnJS(toolUp)(owned ? tx.value : 0, owned ? ty.value : 0, owned);
    });

  // Double-tap enters text: on a shape it opens that shape's label, on existing text it edits
  // it, and on empty canvas it drops a new box — the affordance every drawing app trains for,
  // and the mobile equivalent of desktop's double-click.
  const doubleTapAt = useCallback(
    (sx: number, sy: number) => {
      if (state.tool !== 'select' || state.textEdit) return;
      const point = toScene(sx, sy);
      const hit = hitTestTopmost(state.elements, point, hitToleranceAt(viewport.zoom));

      // hitTestTopmost never returns bound text, so double-tapping a label reaches the shape
      // it belongs to and lands here — which is what edits it.
      if (hit && isContainer(hit)) {
        dispatch({ type: 'BEGIN_CONTAINER_TEXT', containerId: hit.id });
        return;
      }
      if (hit?.kind === 'text') {
        dispatch({ type: 'BEGIN_TEXT_EDIT', id: hit.id });
        return;
      }
      if (!hit) {
        dispatch({ type: 'SET_TOOL', tool: 'text' });
        dispatch({ type: 'POINTER_DOWN', point });
      }
    },
    [dispatch, state.elements, state.textEdit, state.tool, toScene, viewport],
  );

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd((e, success) => {
      'worklet';
      if (success) runOnJS(doubleTapAt)(e.x, e.y);
    });

  // Everything runs simultaneously, including the double-tap.
  //
  // It used to be Exclusive(doubleTap, ...), which reads sensibly — resolve the tap first so a
  // second tap isn't eaten as the start of a drag — but it makes every other gesture wait for
  // the tap to *fail*, i.e. for its 300ms maxDuration plus the gap allowed between taps. Every
  // drag began with roughly half a second of nothing happening.
  //
  // Running them together costs nothing: a drag is never recognised as a tap, and the extra
  // down/up pair a double-tap sends through the reducer only re-selects what is already
  // selected before the text edit opens.
  const gesture = Gesture.Simultaneous(doubleTap, pinch, twoFingerPan, oneFingerPan, toolGesture);

  const tile = gridStep(viewport.zoom) * viewport.zoom;
  // The tile origin is offset by the panned distance, modulo one tile, so the grid slides
  // under the content instead of scaling into a moiré. Taking the modulo here rather than
  // translating by the raw offset keeps the numbers small — a canvas panned far from the
  // origin would otherwise hand the tile a value large enough to lose precision.
  // Shifted by OVERDRAW as well, because the drawing surface starts that far above and left
  // of the visible box — without it the dot lattice would sit a constant offset from the
  // scene it belongs to.
  const phase = (v: number) => ((v % tile) + tile) % tile;
  const gridX = phase(-viewport.x * viewport.zoom);
  const gridY = phase(-viewport.y * viewport.zoom);

  // Everything below is memoized on what it actually depends on, and none of it depends on
  // viewport.x/y. That is the point: a pan changes only those two numbers, so every list and
  // every rendered element keeps its identity and React re-renders nothing but the two
  // transform props on the groups. Rebuilding the whole tree sixty times a second was what
  // made dragging feel heavy.
  const editingId = state.textEdit?.id ?? null;
  const visible = useMemo(
    () => visibleElements(state).filter((el) => el.id !== editingId),
    // visibleElements reads exactly these two, plus the draft it appends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.elements, state.draft, editingId],
  );
  const dragging: Set<string> = useMemo(
    () => (state.drag?.kind === 'move' ? new Set(Object.keys(state.drag.origin)) : EMPTY_SET),
    [state.drag],
  );

  // Everything not in the current gesture, held stable by reference so a drag frame cannot
  // invalidate it. This is what takes the untouched scene off the per-frame render path.
  const staticVisible = useStableList(
    useMemo(() => visible.filter((el) => !dragging.has(el.id)), [visible, dragging]),
  );
  const frames = useMemo(() => staticVisible.filter(isFrame), [staticVisible]);
  const elements = useMemo(() => staticVisible.filter((el) => !isFrame(el)), [staticVisible]);
  // Active elements come straight from state every frame — that is the point.
  const activeElements = useMemo(
    () => visible.filter((el) => dragging.has(el.id)),
    [visible, dragging],
  );
  const faded = erasing ?? EMPTY_SET;
  // Bound text is excluded: a label inside a shape is selected through its container, so
  // drawing a second frame around the text itself would read as two selected objects.
  const selected = useMemo(
    () => staticVisible.filter((el) => state.selectedIds.includes(el.id) && !isBoundText(el)),
    [staticVisible, state.selectedIds],
  );
  // A boolean rather than `state.drag` itself: the drag object is new on every frame, and the
  // static memo reads this — depending on the object would rebuild the whole scene per frame,
  // which is exactly what the split exists to avoid.
  const idle = state.drag === null;

  const activeSelected = useMemo(
    () => activeElements.filter((el) => !isBoundText(el)),
    [activeElements],
  );
  // Ids currently travelling with a move gesture — the selection plus the labels and frame
  // children that come along with it. Read from the drag's own origin map rather than
  // recomputed, so it can't disagree with what the reducer is actually moving.

  // The scene itself. Held apart from the transform groups so that panning — which touches
  // nothing in here — reuses this entire subtree by reference and React skips it wholesale.
  // Depends on the individual colour strings rather than the `colors` object, because
  // useTheme() builds a fresh object on every render and would defeat the memo outright.
  const sceneContent = useMemo(
    () => (
      <>
        {/* One clip region per frame, so content overrunning a frame is cut off at its
                  edge rather than spilling across the canvas.

                  Defined HERE, inside the viewport transform, rather than in the root <Defs>
                  where desktop keeps it. DOM SVG resolves clipPathUnits="userSpaceOnUse"
                  against the space of the element that *references* the clip, so the root
                  works there. react-native-svg resolves it against the space where the clip is
                  *defined* — from the root, these scene-space rects landed nowhere near their
                  elements and clipped them to nothing, so anything a frame captured became
                  invisible. Declaring them in the same group as the elements makes the two
                  spaces identical and is correct under either rule. */}
        <Defs>
          {frames.map((f) => (
            // The key carries the frame's geometry while the id stays stable.
            //
            // react-native-svg's ClipPathView is a GroupView, and GroupView.getPath
            // caches its Path the first time it is asked and only rebuilds it when
            // clearCache() nulls it — which a child Rect changing x/y never triggers.
            // The default clipRule is an uninitialized int (0 = evenodd), and that
            // branch reads exactly that cached path. So without this, a frame's clip is
            // frozen at wherever the frame first was, and moving the frame clips its
            // children against the old rectangle — cutting them off on every side.
            //
            // Changing the key remounts the node, and a fresh one has a null path. The
            // id is unchanged, so `url(#frame-clip-…)` still resolves and the new node
            // simply replaces the old entry in the SvgView's definition map.
            <ClipPath key={`clip-${f.id}-${f.x},${f.y},${f.w},${f.h}`} id={`frame-clip-${f.id}`}>
              <Rect x={f.x} y={f.y} width={f.w} height={f.h} />
            </ClipPath>
          ))}
        </Defs>

        {/* Frames first, so a region always sits behind the work it holds, whatever
                  the array order says. */}
        {frames.map((f) => (
          <G key={f.id} opacity={faded.has(f.id) ? 0.25 : 1}>
            <ElementView el={f} frame={rotationFrameOf(f, staticVisible)} />
            {/* Divided by zoom so the label holds a constant on-screen size — a frame
                      name is chrome, and should not grow with the drawing. */}
            <SvgText
              x={f.x}
              y={f.y - 6 / viewport.zoom}
              fill={colors.ink3}
              fontSize={12 / viewport.zoom}
              fontFamily="Geist-Regular"
            >
              {f.name}
            </SvgText>
          </G>
        ))}

        {elements
          .filter((el) => !dragging.has(el.id))
          .map((el) => (
            <G
              key={el.id}
              // Faded rather than removed while the eraser is down: you can see what the
              // sweep has caught and back out, instead of finding out afterwards.
              opacity={faded.has(el.id) ? 0.25 : 1}
              // Elements in flight are not clipped. Membership now settles at the end of a
              // gesture rather than continuously, so a child dragged out of a frame still
              // carries its old frameId all the way — clipping it would cut it off at the
              // boundary it is in the middle of leaving.
              clipPath={
                el.frameId && !dragging.has(el.id) ? `url(#frame-clip-${el.frameId})` : undefined
              }
            >
              <ElementView
                el={el}
                frame={rotationFrameOf(el, staticVisible)}
                imageUrl={el.kind === 'image' ? imageUrls?.get(el.fileId) : undefined}
                strokeOverride={labelStrokeFor(el, staticVisible)}
              />
            </G>
          ))}

        {/* Selection chrome: outline, resize handles, rotate grip, endpoint grips.
                  Suppressed while a gesture is in flight — handles drawn over a shape you are
                  actively dragging or resizing just chase the pointer and obscure the result.
                  A marquee is the exception: watching the caught set light up is the point. */}
        {selected
          .filter((el) => !dragging.has(el.id))
          .map((el) => (
            <SelectionFrame
              key={`sel-${el.id}`}
              el={el}
              zoom={viewport.zoom}
              // Resize and rotate act on a single element, so several at once would
              // promise something that doesn't work.
              interactive={selected.length === 1 && idle}
            />
          ))}
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      frames,
      elements,
      selected,
      faded,
      imageUrls,
      staticVisible,
      idle,
      viewport.zoom,
      colors.ink3,
      colors.amber,
    ],
  );

  return (
    <GestureDetector gesture={gesture}>
      {/* collapsable={false} keeps Android from flattening this away — the gesture handler
          needs a real native view to attach to. */}
      {/* overflow-hidden matters: the surface below is deliberately bigger than this box, and
          without clipping it would paint over the toolbar and the header. */}
      <View className="flex-1 overflow-hidden" collapsable={false}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: -OVERDRAW,
              top: -OVERDRAW,
              right: -OVERDRAW,
              bottom: -OVERDRAW,
            },
            panStyle,
          ]}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern
                id="canvas-dots"
                x={gridX}
                y={gridY}
                width={tile}
                height={tile}
                patternUnits="userSpaceOnUse"
              >
                <Circle cx={1} cy={1} r={1} fill={colors.line2} />
              </Pattern>
            </Defs>

            {/* The outer group maps this box's coordinates into the oversized surface, so a
              touch at the top-left of the *visible* canvas still lands on the scene point drawn
              there. Everything else — hit-testing, the text overlay — works in visible-box
              coordinates and needs no adjustment.

              Inside it, nested rather than one transform string: react-native-svg applies its
              own transform props in a fixed order, so scale-then-translate is expressed by
              nesting to match desktop's `scale(z) translate(-x -y)` exactly. */}
            <G translateX={OVERDRAW} translateY={OVERDRAW}>
              {/* Drawn inside the panned group so the grid travels with the scene. */}
              <Rect
                x={-GRID_SPAN}
                y={-GRID_SPAN}
                width={GRID_SPAN * 2}
                height={GRID_SPAN * 2}
                fill="url(#canvas-dots)"
              />
              <G scale={viewport.zoom}>
                <G translateX={-viewport.x} translateY={-viewport.y}>
                  {sceneContent}
                </G>
              </G>
            </G>
          </Svg>

          {/* The active layer gets its own Svg, inset to exactly the visible box.

              react-native-svg repaints a whole Svg surface when anything inside it changes, so
              while these shared one surface a drag frame repainted the entire scene and the
              split bought nothing. Separated, a drag repaints roughly the screen and never
              touches the static surface at all.

              No overdraw here: the two layers are never busy at once — a pan has no active
              elements, and a shape drag cannot pan (maxPointers(1)) — so clipping this one to
              the visible box only matters when there is nothing in it. */}
          <Svg
            style={{
              position: 'absolute',
              left: OVERDRAW,
              top: OVERDRAW,
              right: OVERDRAW,
              bottom: OVERDRAW,
            }}
          >
            <G>
              <G scale={viewport.zoom}>
                <G translateX={-viewport.x} translateY={-viewport.y}>
                  {/* Everything in the current gesture. Rendered here rather than in the memo
              above, and from state every frame: its members move because the reducer
              moves them, so there is no offset to fold and nothing that can be a frame
              out of step. It is a separate layer purely so the static scene above keeps
              its identity and stays off the per-frame path. */}
                  {activeElements.map((el) => (
                    <G key={el.id} opacity={faded.has(el.id) ? 0.25 : 1}>
                      <ElementView
                        el={el}
                        frame={rotationFrameOf(el, state.elements)}
                        imageUrl={el.kind === 'image' ? imageUrls?.get(el.fileId) : undefined}
                        strokeOverride={labelStrokeFor(el, state.elements)}
                      />
                    </G>
                  ))}
                  {activeSelected.map((el) => (
                    <SelectionFrame
                      key={`sel-${el.id}`}
                      el={el}
                      zoom={viewport.zoom}
                      interactive={false}
                    />
                  ))}

                  {/* The rubber band itself, while a marquee drag is in flight. */}
                  {state.drag?.kind === 'marquee' && (
                    <Rect
                      x={Math.min(state.drag.start.x, state.drag.current.x)}
                      y={Math.min(state.drag.start.y, state.drag.current.y)}
                      width={Math.abs(state.drag.current.x - state.drag.start.x)}
                      height={Math.abs(state.drag.current.y - state.drag.start.y)}
                      fill={colors.amber}
                      fillOpacity={0.08}
                      stroke={colors.amber}
                      strokeWidth={1 / viewport.zoom}
                      strokeDasharray={`${4 / viewport.zoom} ${3 / viewport.zoom}`}
                    />
                  )}
                </G>
              </G>
            </G>
          </Svg>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

// Module-level so the default doesn't allocate a new Set on every render and defeat the
// memo on ElementView.
const EMPTY_SET: Set<string> = new Set();
