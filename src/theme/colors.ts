import type { Tone, Accent } from './types';

const TONES: Record<Tone, { bg: string; bg2: string; paper: string; paper2: string; ink: string; cream: string }> = {
  'warm-ink': {
    bg: '#13110e', bg2: '#1c1814', paper: '#251f19', paper2: '#2c251d',
    ink: '#ede4d3', cream: '#f0e0c0',
  },
  'pure-black': {
    bg: '#0a0a0a', bg2: '#111111', paper: '#1a1a1a', paper2: '#222222',
    ink: '#e8e8e8', cream: '#f0f0f0',
  },
  'cool': {
    bg: '#14141a', bg2: '#1b1b22', paper: '#22222c', paper2: '#2a2a36',
    ink: '#e6e6ed', cream: '#eeeef5',
  },
  'forest': {
    bg: '#0f1614', bg2: '#151e1b', paper: '#1c2622', paper2: '#222e29',
    ink: '#e0e8e3', cream: '#e8f0eb',
  },
};

const ACCENTS: Record<Accent, string> = {
  amber: '#e8c89a',
  cream: '#e8d8b8',
  coral: '#d9a08c',
  sage:  '#a8c4a0',
  mono:  '#9c917c',
};

export function getColors(tone: Tone = 'warm-ink', accent: Accent = 'amber') {
  const t = TONES[tone];
  const a = ACCENTS[accent];
  return {
    bg:     t.bg,
    bg2:    t.bg2,
    paper:  t.paper,
    paper2: t.paper2,
    line:   'rgba(232,216,184,0.07)',
    line2:  'rgba(232,216,184,0.13)',
    ink:    t.ink,
    ink2:   blend(t.ink, 0.75),
    ink3:   blend(t.ink, 0.5),
    ink4:   blend(t.ink, 0.32),
    amber:  a,
    cream:  t.cream,
  };
}

export type ThemeColors = ReturnType<typeof getColors>;

export function resolveColor(color: string | undefined, colors: ThemeColors): string | undefined {
  if (!color) return undefined;
  return color in colors ? colors[color as keyof ThemeColors] : color;
}

// Dims a hex color toward black by the given opacity factor
function blend(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
