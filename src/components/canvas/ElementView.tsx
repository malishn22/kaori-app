import React, { memo } from 'react';
import {
  Ellipse,
  G,
  Image as SvgImage,
  Path,
  Rect,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';
import type {
  CanvasElement,
  ColorToken,
  FrameElement,
  ImageElement,
  RotationFrame,
} from 'kaori-core';
import {
  TEXT_LINE_HEIGHT,
  arrowHeadFor,
  dashArrayFor,
  isStrokeElement,
  pathDFor,
} from 'kaori-core';
import { useTheme } from '@/theme';
import { CANVAS_FONTS, canvasColor } from './colors';

// One committed element, rendered with react-native-svg. The mobile counterpart of
// kaori-desktop/src/components/canvas/ElementView.tsx — same geometry from the same core
// helpers, only the element names and color resolution differ.
//
// Memoized on the element object itself: the reducer never mutates, so reference equality
// skips every untouched element when a single shape moves. useTheme() is a context read,
// which re-renders through memo on its own when the palette changes.
export const ElementView = memo(function ElementView({
  el,
  frame,
  imageUrl,
  strokeOverride,
}: {
  el: CanvasElement;
  frame?: RotationFrame | null;
  imageUrl?: string;
  // Set for a label sitting on a light fill, where its own near-white stroke would be
  // unreadable. Computed by core from the container's fill token — see labelStrokeFor.
  strokeOverride?: ColorToken | null;
}) {
  // Rotation is one wrapping transform rather than baked into each shape's coordinates, so
  // every geometry calculation underneath stays axis-aligned. A bound label gets its
  // container's frame, which is what makes the pair spin as one object.
  //
  // `rotation`/`originX`/`originY` are react-native-svg's own props — preferred over a
  // transform string, which its parser handles less predictably across versions.
  if (frame) {
    return (
      <G rotation={(frame.angle * 180) / Math.PI} originX={frame.cx} originY={frame.cy}>
        <UnrotatedElement el={el} imageUrl={imageUrl} strokeOverride={strokeOverride} />
      </G>
    );
  }
  return <UnrotatedElement el={el} imageUrl={imageUrl} strokeOverride={strokeOverride} />;
});

function UnrotatedElement({
  el,
  imageUrl,
  strokeOverride,
}: {
  el: CanvasElement;
  imageUrl?: string;
  strokeOverride?: ColorToken | null;
}) {
  const { colors } = useTheme();

  if (el.kind === 'image') {
    // No url yet means the bytes are still coming back from AsyncStorage. A faint
    // placeholder holds the space rather than the element popping in — and it's also what a
    // genuinely missing file looks like, which beats an invisible hole you can still select.
    if (!imageUrl) {
      return (
        <Rect
          x={el.x}
          y={el.y}
          width={el.w}
          height={el.h}
          fill={colors.paper2}
          stroke={colors.line2}
          strokeWidth={1}
          opacity={el.opacity}
        />
      );
    }
    return (
      <SvgImage
        href={{ uri: imageUrl }}
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        opacity={el.opacity}
        // The element's own box is authoritative — it was created from the natural aspect
        // ratio and resizes aspect-locked, so letting SVG re-fit would fight that.
        preserveAspectRatio="none"
      />
    );
  }

  if (el.kind === 'frame') {
    // Chrome, not artwork: a muted border so the region reads as a boundary rather than
    // competing with the work inside it. The name label is drawn by SceneView, which knows
    // the zoom needed to keep it a constant on-screen size.
    return (
      <Rect
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        rx={2}
        fill="none"
        stroke={colors.line2}
        strokeWidth={1.5}
        opacity={el.opacity}
      />
    );
  }

  return <ShapeElement el={el} strokeOverride={strokeOverride} />;
}

// Images and frames are handled above and excluded here, which is what lets the text branch
// at the bottom narrow cleanly to TextElement.
function ShapeElement({
  el,
  strokeOverride,
}: {
  el: Exclude<CanvasElement, ImageElement | FrameElement>;
  strokeOverride?: ColorToken | null;
}) {
  const { colors } = useTheme();
  const stroke = canvasColor(strokeOverride ?? el.stroke, colors);
  const fill = el.fill === null ? 'none' : canvasColor(el.fill, colors);
  // undefined for solid, so the prop is omitted entirely rather than set to "none".
  const dashArray = dashArrayFor(el.dash, el.strokeWidth);

  if (isStrokeElement(el)) {
    // arrowHeadFor aims along the *routed* last segment, so an elbow's head points down its
    // final axis-aligned run rather than back at where the arrow started.
    const head = arrowHeadFor(el);
    return (
      // Points are stored local to the element's origin, so one translate places both the
      // shaft and its head — no per-point arithmetic at render time.
      <G translateX={el.x} translateY={el.y} opacity={el.opacity}>
        <Path
          d={pathDFor(el)}
          fill="none"
          stroke={stroke}
          strokeWidth={el.strokeWidth}
          strokeDasharray={dashArray}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {head && (
          // Never dashed even when the shaft is — a broken-up arrowhead stops reading as an
          // arrowhead.
          <Path
            d={head}
            fill="none"
            stroke={stroke}
            strokeWidth={el.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </G>
    );
  }

  if (el.kind === 'rect') {
    return (
      <Rect
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        rx={el.radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={el.strokeWidth}
        strokeDasharray={dashArray}
        // Required for the dotted style: its dasharray uses zero-length segments, which
        // paint as round dots under a round cap and as literally nothing under the default
        // butt cap — the border would vanish outright.
        strokeLinecap="round"
        opacity={el.opacity}
      />
    );
  }

  if (el.kind === 'ellipse') {
    return (
      <Ellipse
        cx={el.x + el.w / 2}
        cy={el.y + el.h / 2}
        rx={el.w / 2}
        ry={el.h / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={el.strokeWidth}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        opacity={el.opacity}
      />
    );
  }

  // Text. `lines` is the cached wrap result from kaori-core's layoutText — SVG text does no
  // wrapping of its own on either platform, so each line is an explicitly positioned TSpan.
  const lineHeight = el.fontSize * TEXT_LINE_HEIGHT;
  // Centered text anchors on the box's midline, left-aligned on its left edge. Both use the
  // element's own bounds, so alignment shifts the glyphs within the box rather than moving
  // the box.
  const centered = el.align === 'center';
  const anchorX = centered ? el.x + el.w / 2 : el.x;
  return (
    <SvgText
      fill={stroke}
      opacity={el.opacity}
      fontSize={el.fontSize}
      fontFamily={CANVAS_FONTS[el.fontFamily]}
      textAnchor={centered ? 'middle' : 'start'}
    >
      {el.lines.map((line, i) => (
        // Each line's baseline is positioned explicitly at 0.8 of a line below its top,
        // which is what lines the glyphs up with the TextInput overlay during editing —
        // rather than relying on alignmentBaseline, which differs between the platforms.
        <TSpan key={i} x={anchorX} y={el.y + lineHeight * (i + 0.8)}>
          {line === '' ? ' ' : line}
        </TSpan>
      ))}
    </SvgText>
  );
}
