import type { Note, Folder, Profile, Task } from '@/types';
import { SEED_NOTES, SEED_FOLDERS, SEED_TASKS } from '@/types';
import { safeGet, safeSet, safeMultiGet, safeMultiSet, safeMultiRemove } from './storage';

const KEYS = {
  notes: '@kaori_notes',
  folders: '@kaori_folders',
  profile: '@kaori_profile',
  tasks: '@kaori_tasks',
} as const;

export { KEYS };

const RESET_KEY = '@kaori_reset_v2';

const DEFAULT_PROFILE: Profile = {
  name: 'Mali',
  initial: 'm',
  defaultFolder: 'inbox',
};

export { DEFAULT_PROFILE };

export async function loadInitialData(): Promise<{
  notes: Note[];
  folders: Folder[];
  profile: Profile;
  tasks: Task[];
}> {
  // Run migration if needed
  const resetDone = await safeGet(RESET_KEY);
  if (!resetDone) {
    await safeMultiRemove([KEYS.notes, KEYS.folders, KEYS.profile]);
    await safeSet(RESET_KEY, '1');
  }

  const results = await safeMultiGet([KEYS.notes, KEYS.folders, KEYS.profile, KEYS.tasks]);
  const rawNotes = results[0][1];
  const rawFolders = results[1][1];
  const rawProfile = results[2][1];
  const rawTasks = results[3][1];

  if (!rawNotes) {
    // First launch: seed and persist
    await safeMultiSet([
      [KEYS.notes, JSON.stringify(SEED_NOTES)],
      [KEYS.folders, JSON.stringify(SEED_FOLDERS)],
      [KEYS.profile, JSON.stringify(DEFAULT_PROFILE)],
      [KEYS.tasks, JSON.stringify(SEED_TASKS)],
    ]);
    return { notes: SEED_NOTES, folders: SEED_FOLDERS, profile: DEFAULT_PROFILE, tasks: SEED_TASKS };
  }

  try {
    const notes = rawNotes ? JSON.parse(rawNotes).map((n: Note) => ({ ...n, links: n.links ?? {} })) : SEED_NOTES;
    const folders = rawFolders ? JSON.parse(rawFolders) : SEED_FOLDERS;
    const profile = rawProfile ? { ...DEFAULT_PROFILE, ...JSON.parse(rawProfile) } : DEFAULT_PROFILE;
    const tasks = rawTasks ? JSON.parse(rawTasks) : SEED_TASKS;
    return { notes, folders, profile, tasks };
  } catch (e) {
    console.warn('[Kaori] Failed to parse stored data:', e);
    return { notes: SEED_NOTES, folders: SEED_FOLDERS, profile: DEFAULT_PROFILE, tasks: SEED_TASKS };
  }
}
