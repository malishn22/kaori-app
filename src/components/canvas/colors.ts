import type { ColorToken } from 'kaori-core';
import type { ThemeColors } from '@/theme';

// Scenes store theme tokens, not hex — so a drawing re-colors when the tone/accent
// changes, like every other surface in the app.
//
// Desktop resolves these to `var(--color-*)` and lets CSS repaint. React Native has no
// such indirection: colors have to be concrete values at render time, so this resolves
// against the live palette from useTheme() and the SVG re-renders when the theme changes.
export function canvasColor(token: ColorToken, colors: ThemeColors): string {
  if (token.startsWith('custom:')) return token.slice('custom:'.length);
  // Every non-custom ColorToken is a ThemeColors key by construction; the fallback exists
  // only so a scene hand-edited to an unknown token still draws something visible.
  return colors[token as keyof ThemeColors] ?? colors.ink;
}

// Mirrors kaori-desktop/src/components/canvas/colors.ts so both toolbars offer the same
// palette. Restricted to theme tokens on purpose — an arbitrary color produces a canvas
// that clashes with every tone but the one it was drawn in.
export const STROKE_TOKENS: ColorToken[] = ['ink', 'ink3', 'amber', 'cream'];

// null is "no fill", and the default: an outlined shape lets you tap through to whatever
// sits inside it (see hitTest in kaori-core).
export const FILL_TOKENS: (ColorToken | null)[] = [null, 'paper2', 'ink4', 'amber'];

export const STROKE_WIDTHS = [1, 2, 4, 8];

// The loaded font families, keyed by the scene's own `fontFamily` values. Names must match
// what app/_layout.tsx passes to useFonts — a missing family silently falls back to the
// system face, which changes every measured text width.
export const CANVAS_FONTS: Record<'sans' | 'hand', string> = {
  sans: 'Geist-Regular',
  hand: 'Kalam_700Bold',
};
