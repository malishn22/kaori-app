import { vars } from 'nativewind';
import { getColors } from './colors';
import type { Tone, Accent } from './types';

export function themeVars(tone: Tone, accent: Accent) {
  const c = getColors(tone, accent);
  return vars({
    '--color-bg': c.bg,
    '--color-bg2': c.bg2,
    '--color-paper': c.paper,
    '--color-paper2': c.paper2,
    '--color-line': c.line,
    '--color-line2': c.line2,
    '--color-ink': c.ink,
    '--color-ink2': c.ink2,
    '--color-ink3': c.ink3,
    '--color-ink4': c.ink4,
    '--color-amber': c.amber,
    '--color-cream': c.cream,
  });
}
