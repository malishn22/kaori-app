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
  done: boolean;
  createdAt: string;
  pinned: boolean;
  archived?: boolean;
};

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export const SEED_FOLDERS: Folder[] = [];

export const SEED_NOTES: Note[] = [];

export const SEED_TASKS: Task[] = [];
