import React from 'react';
import { Circle, G, Line, Rect } from 'react-native-svg';
import type { CanvasElement } from 'kaori-core';
import {
  HANDLE_SIZE_PX,
  ROTATE_HANDLE_OFFSET_PX,
  angleOf,
  centerOf,
  endpointPositions,
  isLinear,
  localHandlePositions,
} from 'kaori-core';
import { useTheme } from '@/theme';

// Handles are drawn a little larger than desktop's 8px. Core hit-tests them at
// HANDLE_HIT_PX (10) and that constant is shared, so the grab radius is the same on both
// platforms — but a fingertip needs a bigger *target* to aim at than a mouse cursor does.
// Drawing slightly wider than the hit radius means aiming at the centre of the dot lands
// inside it comfortably.
const TOUCH_HANDLE_PX = HANDLE_SIZE_PX * 1.4;

// The outline and grab handles around a selected element. Everything is sized in *screen*
// pixels divided by zoom, so the furniture stays a constant size on screen while the drawing
// under it scales — handles that grew with the canvas would be unusable at high zoom and
// invisible at low.
export function SelectionFrame({
  el,
  zoom,
  interactive,
}: {
  el: CanvasElement;
  zoom: number;
  // Multi-selections show outlines only: resize and rotate act on a single element, so
  // offering handles for several at once would promise something that doesn't work.
  interactive: boolean;
}) {
  const { colors } = useTheme();
  const size = TOUCH_HANDLE_PX / zoom;

  // Lines and arrows get two endpoint grips rather than a transform box: a box can only
  // scale a segment, where what you want is to move an end — which is also the gesture that
  // attaches an arrow to a shape.
  if (isLinear(el)) {
    return (
      <G pointerEvents="none">
        {endpointPositions(el).map(({ index, point }) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={size / 1.6}
            fill={colors.bg}
            stroke={colors.amber}
            strokeWidth={1.5 / zoom}
          />
        ))}
      </G>
    );
  }

  const pad = 4 / zoom;
  const center = centerOf(el);
  const degrees = (angleOf(el) * 180) / Math.PI;

  return (
    <G pointerEvents="none" rotation={degrees} originX={center.x} originY={center.y}>
      <Rect
        x={el.x - pad}
        y={el.y - pad}
        width={el.w + pad * 2}
        height={el.h + pad * 2}
        fill="none"
        stroke={colors.amber}
        strokeWidth={1 / zoom}
        strokeDasharray={interactive ? undefined : `${4 / zoom} ${3 / zoom}`}
      />

      {interactive && (
        <>
          {/* Stem from the top edge to the rotate grip, so it reads as attached to the shape
              rather than floating near it. */}
          <Line
            x1={el.x + el.w / 2}
            y1={el.y - pad}
            x2={el.x + el.w / 2}
            y2={el.y - ROTATE_HANDLE_OFFSET_PX / zoom}
            stroke={colors.amber}
            strokeWidth={1 / zoom}
          />
          <Circle
            cx={el.x + el.w / 2}
            cy={el.y - ROTATE_HANDLE_OFFSET_PX / zoom}
            r={size / 1.6}
            fill={colors.bg}
            stroke={colors.amber}
            strokeWidth={1.5 / zoom}
          />
          {/* Drawn in the element's unrotated frame — the wrapping G's rotation puts them
              where they belong. Positions come from core, the same function the reducer
              hit-tests against, so what you see and what you can grab can't drift apart. */}
          {localHandlePositions(el).map(({ handle, point }) => (
            <Rect
              key={handle}
              x={point.x - size / 2}
              y={point.y - size / 2}
              width={size}
              height={size}
              rx={1.5 / zoom}
              fill={colors.bg}
              stroke={colors.amber}
              strokeWidth={1.5 / zoom}
            />
          ))}
        </>
      )}
    </G>
  );
}
