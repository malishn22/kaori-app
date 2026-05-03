import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { FAB, ProjectCard, PageHeader } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

export default function ProjectsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { projects: allProjects, notes: allNotes, tasks: allTasks } = useStore();
  const projects = useMemo(() => allProjects.filter(p => !p.archived), [allProjects]);
  const noteCounts = useMemo(
    () => allNotes.filter(n => !n.archived).reduce<Record<string, number>>((acc, note) => {
      if (note.project) acc[note.project] = (acc[note.project] ?? 0) + 1;
      return acc;
    }, {}),
    [allNotes]
  );
  const taskCounts = useMemo(
    () => allTasks.filter(t => !t.archived && !t.done).reduce<Record<string, number>>((acc, task) => {
      if (task.project) acc[task.project] = (acc[task.project] ?? 0) + 1;
      return acc;
    }, {}),
    [allTasks]
  );
  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [projects]
  );
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader caption="your folders" title="projects" underlineWidth={92} settingsButton />
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180 }} showsVerticalScrollIndicator={false}>

        <View style={{ paddingHorizontal: 18, paddingTop: 24, gap: 14 }}>
          {sortedProjects.map((p, i) => (
            <TouchableOpacity key={p.id} onPress={() => router.push(`/project/${p.id}`)} activeOpacity={0.85}>
              <ProjectCard project={p} index={i} noteCount={noteCounts[p.id] ?? 0} taskCount={taskCounts[p.id] ?? 0} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FAB onPress={() => router.push('/project/new')}  />
    </View>
  );
}
