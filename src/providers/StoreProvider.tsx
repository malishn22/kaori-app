import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Idea, Project, Profile } from '@/types';
import { SEED_IDEAS, SEED_PROJECTS } from '@/types';
import { computeDisplayStrings } from '@/utils/time';

const KEYS = {
  ideas: '@kaori_ideas',
  projects: '@kaori_projects',
  profile: '@kaori_profile',
} as const;

const RESET_KEY = '@kaori_reset_v2';

const DEFAULT_PROFILE: Profile = {
  name: 'margaret',
  initial: 'm',
  defaultProject: 'inbox',
};

type StoreContextValue = {
  ideas: Idea[];
  projects: Project[];
  profile: Profile;
  addIdea: (text: string, projectId: string | null) => Promise<void>;
  addProject: (name: string, color: string, note: string) => Promise<void>;
  updateIdea: (id: string, patch: Partial<Pick<Idea, 'text' | 'project' | 'pinned'>>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  pinProject: (id: string, pinned: boolean) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectColor: (id: string, color: string) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue>({
  ideas: SEED_IDEAS,
  projects: SEED_PROJECTS,
  profile: DEFAULT_PROFILE,
  addIdea: async () => {},
  addProject: async () => {},
  updateIdea: async () => {},
  deleteIdea: async () => {},
  updateProfile: async () => {},
  pinProject: async () => {},
  deleteProject: async () => {},
  updateProjectColor: async () => {},
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>(SEED_IDEAS);
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(RESET_KEY).then(async (resetDone) => {
      if (!resetDone) {
        await AsyncStorage.multiRemove([KEYS.ideas, KEYS.projects, KEYS.profile]);
        await AsyncStorage.setItem(RESET_KEY, '1');
      }

      AsyncStorage.multiGet([KEYS.ideas, KEYS.projects, KEYS.profile]).then((results) => {
      const rawIdeas = results[0][1];
      const rawProjects = results[1][1];
      const rawProfile = results[2][1];

      if (!rawIdeas) {
        // First launch: seed and persist
        AsyncStorage.multiSet([
          [KEYS.ideas, JSON.stringify(SEED_IDEAS)],
          [KEYS.projects, JSON.stringify(SEED_PROJECTS)],
          [KEYS.profile, JSON.stringify(DEFAULT_PROFILE)],
        ]);
        return;
      }

      try {
        if (rawIdeas) setIdeas(JSON.parse(rawIdeas));
        if (rawProjects) setProjects(JSON.parse(rawProjects));
        if (rawProfile) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(rawProfile) });
      } catch {}
      });
    });
  }, []);

  async function addIdea(text: string, projectId: string | null) {
    const createdAt = new Date().toISOString();
    const { time, date } = computeDisplayStrings(createdAt);
    const newIdea: Idea = {
      id: Date.now().toString(),
      project: projectId,
      text,
      time,
      date,
      createdAt,
      tags: [],
      pinned: false,
    };

    const nextIdeas = [newIdea, ...ideas];

    const nextProjects = projectId
      ? projects.map((p) => {
          if (p.id !== projectId) return p;
          return { ...p, count: p.count + 1, updated: 'just now' };
        })
      : projects;

    setIdeas(nextIdeas);
    setProjects(nextProjects);

    await AsyncStorage.multiSet([
      [KEYS.ideas, JSON.stringify(nextIdeas)],
      [KEYS.projects, JSON.stringify(nextProjects)],
    ]);
  }

  async function addProject(name: string, color: string, note: string) {
    const createdAt = new Date().toISOString();
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      count: 0,
      color,
      updated: 'just now',
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
    const nextIdeas = ideas.map(i => i.project === id ? { ...i, project: null } : i);
    setProjects(nextProjects);
    setIdeas(nextIdeas);
    await AsyncStorage.multiSet([
      [KEYS.projects, JSON.stringify(nextProjects)],
      [KEYS.ideas, JSON.stringify(nextIdeas)],
    ]);
  }

  async function updateProjectColor(id: string, color: string) {
    const nextProjects = projects.map(p => p.id === id ? { ...p, color } : p);
    setProjects(nextProjects);
    await AsyncStorage.setItem(KEYS.projects, JSON.stringify(nextProjects));
  }

  async function updateIdea(id: string, patch: Partial<Pick<Idea, 'text' | 'project' | 'pinned'>>) {
    const nextIdeas = ideas.map(i => i.id === id ? { ...i, ...patch } : i);
    setIdeas(nextIdeas);
    await AsyncStorage.setItem(KEYS.ideas, JSON.stringify(nextIdeas));
  }

  async function deleteIdea(id: string) {
    const idea = ideas.find(i => i.id === id);
    const nextIdeas = ideas.filter(i => i.id !== id);
    const nextProjects = idea?.project
      ? projects.map(p => p.id !== idea.project ? p : { ...p, count: Math.max(0, p.count - 1) })
      : projects;
    setIdeas(nextIdeas);
    setProjects(nextProjects);
    await AsyncStorage.multiSet([
      [KEYS.ideas, JSON.stringify(nextIdeas)],
      [KEYS.projects, JSON.stringify(nextProjects)],
    ]);
  }

  async function updateProfile(patch: Partial<Profile>) {
    const nextProfile = { ...profile, ...patch };
    setProfile(nextProfile);
    await AsyncStorage.setItem(KEYS.profile, JSON.stringify(nextProfile));
  }

  return (
    <StoreContext.Provider value={{ ideas, projects, profile, addIdea, addProject, updateIdea, deleteIdea, updateProfile, pinProject, deleteProject, updateProjectColor }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
