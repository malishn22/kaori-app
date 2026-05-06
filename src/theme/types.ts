export type Tone = 'warm-ink' | 'pure-black' | 'cool' | 'forest';
export type Accent = 'amber' | 'cream' | 'coral' | 'sage' | 'mono';

export type ReminderTiming = 'at_time' | '1h_before' | '1d_before';

export type Settings = {
  tone: Tone;
  accent: Accent;
  hapticOnSave: boolean;
  notificationsEnabled: boolean;
  reminderTiming: ReminderTiming;
};
