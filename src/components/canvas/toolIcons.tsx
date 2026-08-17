import React from 'react';
import Svg, { Path } from 'react-native-svg';

// The same glyph set as kaori-desktop/src/components/canvas/toolIcons.tsx, path for path, so
// a tool reads identically on both platforms. Inline rather than .svg files through
// assets/icons: these are single-path glyphs used by exactly one toolbar.
type Props = { size?: number; color?: string };

function glyph(path: string) {
  return function Icon({ size = 22, color = 'currentColor' }: Props) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  };
}

export const CursorIcon = glyph('M5 3l14 8-6 1.6L10.5 19 5 3z');
export const HandIcon = glyph(
  'M8 12V6.5a1.5 1.5 0 013 0V11m0-.5V5.5a1.5 1.5 0 013 0V11m0-.5V7a1.5 1.5 0 013 0v7a6 6 0 01-6 6h-1a6 6 0 01-6-6v-3a1.5 1.5 0 013 0v1.5',
);
export const SquareIcon = glyph('M4.5 5.5h15v13h-15z');
export const EllipseIcon = glyph(
  'M12 5.5c4.7 0 7.5 2.9 7.5 6.5s-2.8 6.5-7.5 6.5S4.5 15.6 4.5 12 7.3 5.5 12 5.5z',
);
export const LineIcon = glyph('M5 19L19 5');
export const ArrowIcon = glyph('M5 19L19 5M19 5h-6.5M19 5v6.5');
export const ScribbleIcon = glyph(
  'M4 15c2-6 4-8 5.5-6.5S9 16 11 17s4-3 4.5-6 1.5-3.5 2.5-2 1 4.5 2 5.5',
);
export const ImageIcon = glyph('M4 5.5h16v13H4zM4 15l4.5-4.5 5 5M14 13l2.5-2.5L20 14M15 9h.01');
export const TextIcon = glyph('M6 6h12M12 6v12M9.5 18h5');
export const FrameIcon = glyph('M8 3v18M16 3v18M3 8h18M3 16h18');
export const EraserIcon = glyph(
  'M8.5 19L4 14.5a1.5 1.5 0 010-2l8-8a1.5 1.5 0 012 0l4 4a1.5 1.5 0 010 2L11 19zM3 21h18M8.5 19h3',
);
export const UndoIcon = glyph('M4 9h10.5a4.5 4.5 0 010 9H9M4 9l4-4M4 9l4 4');
export const RedoIcon = glyph('M20 9H9.5a4.5 4.5 0 000 9H15M20 9l-4-4M20 9l-4 4');

// Sliders: the control that opens the style strip. Reads as "adjust settings" at 20px in a
// way a paint palette or a droplet does not.
export const StyleIcon = glyph('M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M8 15v4');

// Layer ops, as plain arrows: up moves toward the viewer, down moves away, and a bar means
// "all the way". Desktop tried two overlapping squares to picture the stack first, which was
// unreadable at this size — whether the filled square was in front or behind simply didn't
// register. Direction plus a wall does.
export const BringForwardIcon = glyph('M12 19V6M6 12l6-6 6 6');
export const BringToFrontIcon = glyph('M12 20V9M6.5 14.5l5.5-5.5 5.5 5.5M4 4.5h16');
export const SendBackwardIcon = glyph('M12 5v13M6 12l6 6 6-6');
export const SendToBackIcon = glyph('M12 4v11M6.5 9.5l5.5 5.5 5.5-5.5M4 19.5h16');
