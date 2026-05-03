import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { FAB, FolderCard, PageHeader } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

export default function FoldersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { folders: allFolders, notes: allNotes, tasks: allTasks } = useStore();
  const folders = useMemo(() => allFolders.filter(f => !f.archived), [allFolders]);
  const noteCounts = useMemo(
    () => allNotes.filter(n => !n.archived).reduce<Record<string, number>>((acc, note) => {
      if (note.folder) acc[note.folder] = (acc[note.folder] ?? 0) + 1;
      return acc;
    }, {}),
    [allNotes]
  );
  const taskCounts = useMemo(
    () => allTasks.filter(t => !t.archived && !t.done).reduce<Record<string, number>>((acc, task) => {
      if (task.folder) acc[task.folder] = (acc[task.folder] ?? 0) + 1;
      return acc;
    }, {}),
    [allTasks]
  );
  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [folders]
  );
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader caption="your folders" title="folders" underlineWidth={92} settingsButton />
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180 }} showsVerticalScrollIndicator={false}>

        <View style={{ paddingHorizontal: 18, paddingTop: 24, gap: 14 }}>
          {sortedFolders.map((f, i) => (
            <TouchableOpacity key={f.id} onPress={() => router.push(`/folder/${f.id}`)} activeOpacity={0.85}>
              <FolderCard folder={f} index={i} noteCount={noteCounts[f.id] ?? 0} taskCount={taskCounts[f.id] ?? 0} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FAB onPress={() => router.push('/folder/new')}  />
    </View>
  );
}
