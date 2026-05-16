import type { Tone, Accent } from '@/theme';

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'warm-ink',   label: 'warm ink' },
  { value: 'pure-black', label: 'pure black' },
  { value: 'cool',       label: 'cool' },
  { value: 'forest',     label: 'forest' },
];

export const ACCENT_OPTIONS: { value: Accent; label: string }[] = [
  { value: 'amber', label: 'amber' },
  { value: 'cream', label: 'cream' },
  { value: 'coral', label: 'coral' },
  { value: 'sage',  label: 'sage' },
  { value: 'mono',  label: 'none' },
];
