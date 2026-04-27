import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, Project, Profile } from '@/types';
import { SEED_NOTES, SEED_PROJECTS } from '@/types';
import { computeDisplayStrings } from '@/utils/time';
import { resolveNoteLinks, extractUrls } from '@/utils/links';

const KEYS = {
  notes: '@kaori_notes',
  projects: '@kaori_projects',
  profile: '@kaori_profile',
} as const;

const RESET_KEY = '@kaori_reset_v2';

const DEFAULT_PROFILE: Profile = {
  name: 'Mali',
  initial: 'm',
  defaultProject: 'inbox',
};

type StoreContextValue = {
  notes: Note[];
  projects: Project[];
  profile: Profile;
  addNote: (text: string, projectId: string | null) => Promise<void>;
  addProject: (name: string, color: string, note: string) => Promise<void>;
  updateNote: (id: string, patch: Partial<Pick<Note, 'text' | 'project' | 'pinned' | 'links'>>) => Promise<void>;
  updateNoteLink: (noteId: string, url: string, label: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  pinProject: (id: string, pinned: boolean) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectColor: (id: string, color: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  archiveNote: (id: string, archived: boolean) => Promise<void>;
  archiveProject: (id: string, archived: boolean) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue>({
  notes: SEED_NOTES,
  projects: SEED_PROJECTS,
  profile: DEFAULT_PROFILE,
  addNote: async () => {},
  addProject: async () => {},
  updateNote: async () => {},
  updateNoteLink: async () => {},
  deleteNote: async () => {},
  updateProfile: async () => {},
  pinProject: async () => {},
  deleteProject: async () => {},
  updateProjectColor: async () => {},
  renameProject: async () => {},
  archiveNote: async () => {},
  archiveProject: async () => {},
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(RESET_KEY).then(async (resetDone) => {
      if (!resetDone) {
        await AsyncStorage.multiRemove([KEYS.notes, KEYS.projects, KEYS.profile]);
        await AsyncStorage.setItem(RESET_KEY, '1');
      }

      AsyncStorage.multiGet([KEYS.notes, KEYS.projects, KEYS.profile]).then((results) => {
      const rawNotes = results[0][1];
      const rawProjects = results[1][1];
      const rawProfile = results[2][1];

      if (!rawNotes) {
        // First launch: seed and persist
        AsyncStorage.multiSet([
          [KEYS.notes, JSON.stringify(SEED_NOTES)],
          [KEYS.projects, JSON.stringify(SEED_PROJECTS)],
          [KEYS.profile, JSON.stringify(DEFAULT_PROFILE)],
        ]);
        return;
      }

      try {
        if (rawNotes) setNotes(JSON.parse(rawNotes).map((n: Note) => ({ links: {}, ...n })));
        if (rawProjects) setProjects(JSON.parse(rawProjects));
        if (rawProfile) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(rawProfile) });
      } catch (e) {
        console.warn('[Kaori] Failed to parse stored data:', e);
      }
      });
    });
  }, []);

  async function addNote(text: string, projectId: string | null) {
    const createdAt = new Date().toISOString();
    const { time, date } = computeDisplayStrings(createdAt);
    const noteId = Date.now().toString();
    const newNote: Note = {
      id: noteId,
      project: projectId,
      text,
      time,
      date,
      createdAt,
      tags: [],
      pinned: false,
      links: {},
    };

    const nextNotes = [newNote, ...notes];

    const nextProjects = projectId
      ? projects.map((p) => {
          if (p.id !== projectId) return p;
          return { ...p, count: p.count + 1, updated: new Date().toISOString() };
        })
      : projects;

    setNotes(nextNotes);
    setProjects(nextProjects);

    await AsyncStorage.multiSet([
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.projects, JSON.stringify(nextProjects)],
    ]);

    // Resolve link titles in the background
    if (extractUrls(text).length > 0) {
      resolveNoteLinks(text).then(async (links) => {
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === noteId ? { ...n, links } : n));
          AsyncStorage.setItem(KEYS.notes, JSON.stringify(updated));
          return updated;
        });
      });
    }
  }

  async function addProject(name: string, color: string, note: string) {
    const createdAt = new Date().toISOString();
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      count: 0,
      color,
      updated: createdAt,
      note,
      createdAt,
      pinned: false,
    };
    const nextProjects = [...projects, newProject];
    setProjects(nextProjects);
    await AsyncStorage.setItem(KEYS.projects, JSON.stringify(nextProjects));
  }

  async function pinProject(id: string, pinned: boolean) {
    const nextProjects = projects.map(p => p.id === id ? { ...p, pinned } : p);
    setProjects(nextProjects);
    await AsyncStorage.setItem(KEYS.projects, JSON.stringify(nextProjects));
  }

  async function deleteProject(id: string) {
    const nextProjects = projects.filter(p => p.id !== id);
    const nextNotes = notes.map(n => n.project === id ? { ...n, project: null } : n);
    setProjects(nextProjects);
    setNotes(nextNotes);
    await AsyncStorage.multiSet([
      [KEYS.projects, JSON.stringify(nextProjects)],
      [KEYS.notes, JSON.stringify(nextNotes)],
    ]);
  }

  async function updateProjectColor(id: string, color: string) {
    const nextProjects = projects.map(p => p.id === id ? { ...p, color } : p);
    setProjects(nextProjects);
    await AsyncStorage.setItem(KEYS.projects, JSON.stringify(nextProjects));
  }

  async function renameProject(id: string, name: string) {
    const nextProjects = projects.map(p => p.id === id ? { ...p, name } : p);
    setProjects(nextProjects);
    await AsyncStorage.setItem(KEYS.projects, JSON.stringify(nextProjects));
  }

  async function updateNote(id: string, patch: Partial<Pick<Note, 'text' | 'project' | 'pinned' | 'links'>>) {
    const nextNotes = notes.map(n => n.id === id ? { ...n, ...patch } : n);
    setNotes(nextNotes);
    await AsyncStorage.setItem(KEYS.notes, JSON.stringify(nextNotes));

    // Resolve titles for any new URLs in the text
    if (patch.text && extractUrls(patch.text).length > 0) {
      const mergedExisting = { ...notes.find(n => n.id === id)?.links, ...patch.links };
      resolveNoteLinks(patch.text, mergedExisting).then(async (links) => {
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === id ? { ...n, links } : n));
          AsyncStorage.setItem(KEYS.notes, JSON.stringify(updated));
          return updated;
        });
      });
    }
  }

  async function updateNoteLink(noteId: string, url: string, label: string) {
    const nextNotes = notes.map(n => {
      if (n.id !== noteId) return n;
      return { ...n, links: { ...n.links, [url]: label } };
    });
    setNotes(nextNotes);
    await AsyncStorage.setItem(KEYS.notes, JSON.stringify(nextNotes));
  }

  async function deleteNote(id: string) {
    const note = notes.find(n => n.id === id);
    const nextNotes = notes.filter(n => n.id !== id);
    const nextProjects = note?.project
      ? projects.map(p => p.id !== note.project ? p : { ...p, count: Math.max(0, p.count - 1) })
      : projects;
    setNotes(nextNotes);
    setProjects(nextProjects);
    await AsyncStorage.multiSet([
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.projects, JSON.stringify(nextProjects)],
    ]);
  }

  async function archiveNote(id: string, archived: boolean) {
    const nextNotes = notes.map(n => n.id === id ? { ...n, archived } : n);
    setNotes(nextNotes);
    await AsyncStorage.setItem(KEYS.notes, JSON.stringify(nextNotes));
  }

  async function archiveProject(id: string, archived: boolean) {
    const nextProjects = projects.map(p => p.id === id ? { ...p, archived } : p);
    const nextNotes = notes.map(n => n.project === id ? { ...n, archived } : n);
    setProjects(nextProjects);
    setNotes(nextNotes);
    await AsyncStorage.multiSet([
      [KEYS.projects, JSON.stringify(nextProjects)],
      [KEYS.notes, JSON.stringify(nextNotes)],
    ]);
  }

  async function updateProfile(patch: Partial<Profile>) {
    const nextProfile = { ...profile, ...patch };
    setProfile(nextProfile);
    await AsyncStorage.setItem(KEYS.profile, JSON.stringify(nextProfile));
  }

  return (
    <StoreContext.Provider value={{ notes, projects, profile, addNote, addProject, updateNote, updateNoteLink, deleteNote, updateProfile, pinProject, deleteProject, updateProjectColor, renameProject, archiveNote, archiveProject }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
