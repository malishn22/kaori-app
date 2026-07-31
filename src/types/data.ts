export type Folder = {
  id: string;
  name: string;
  count: number;
  color: string;
  updated: string;
  note: string;
  createdAt: string;
  pinned: boolean;
  archived?: boolean;
  order?: number;
};

export type Note = {
  id: string;
  folder: string | null;
  text: string;
  time: string;
  date: string;
  createdAt: string;
  tags: string[];
  pinned: boolean;
  links: Record<string, string>;
  archived?: boolean;
};

export type Profile = {
  name: string;
  initial: string;
  defaultFolder: string;
};

export type Task = {
  id: string;
  folder: string | null;
  title: string;
  dueDate: string | null;
  reminderAt?: string | null;
  done: boolean;
  createdAt: string;
  pinned: boolean;
  archived?: boolean;
  links: Record<string, string>;
};

export type Routine = {
  id: string;
  folder: string | null;
  title: string;
  daysOfWeek: number[]; // 0=Sun..6=Sat, matches Date.getDay()
  reminderTime: string; // 'HH:mm' 24h, date-independent
  active: boolean;
  createdAt: string;
  pinned: boolean;
  archived?: boolean;
  completions: Record<string, boolean>; // date key 'YYYY-MM-DD' -> done
  links: Record<string, string>;
};

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export const SEED_FOLDERS: Folder[] = [];

export const SEED_NOTES: Note[] = [];

export const SEED_TASKS: Task[] = [];

export const SEED_ROUTINES: Routine[] = [];
