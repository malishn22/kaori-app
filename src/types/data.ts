export type Project = {
  id: string;
  name: string;
  count: number;
  color: string;
  updated: string;
  note: string;
  createdAt: string;
  pinned: boolean;
};

export type Note = {
  id: string;
  project: string | null;
  text: string;
  time: string;
  date: string;
  createdAt: string;
  tags: string[];
  pinned: boolean;
};

export type Profile = {
  name: string;
  initial: string;
  defaultProject: string;
};

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export const SEED_PROJECTS: Project[] = [];

export const SEED_NOTES: Note[] = [];
