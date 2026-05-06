import type { Tone, Accent, ReminderTiming } from '@/theme';

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

export const REMINDER_OPTIONS: { value: ReminderTiming; label: string }[] = [
  { value: 'at_time',    label: 'at due time (9 AM)' },
  { value: '1h_before',  label: '1 hour before (8 AM)' },
  { value: '1d_before',  label: '1 day before' },
];
