export type Tone = 'warm-ink' | 'pure-black' | 'cool' | 'forest';
export type Accent = 'amber' | 'cream' | 'coral' | 'sage' | 'mono';

export type Settings = {
  tone: Tone;
  accent: Accent;
  hapticOnSave: boolean;
};
