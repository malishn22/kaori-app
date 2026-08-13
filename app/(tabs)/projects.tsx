import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/providers/StoreProvider';
import { useActiveFolders } from '@/hooks';
import { FAB, DraggableFolderList, PageHeader } from '@/components/ui';

export default function FoldersScreen() {
  const router = useRouter();
  const { notes: allNotes, tasks: allTasks, reorderFolders } = useStore();
  const folders = useActiveFolders();
  const noteCounts = useMemo(
    () =>
      allNotes
        .filter((n) => !n.archived)
        .reduce<Record<string, number>>((acc, note) => {
          if (note.folder) acc[note.folder] = (acc[note.folder] ?? 0) + 1;
          return acc;
        }, {}),
    [allNotes],
  );
  const taskCounts = useMemo(
    () =>
      allTasks
        .filter((t) => !t.archived && !t.done)
        .reduce<Record<string, number>>((acc, task) => {
          if (task.folder) acc[task.folder] = (acc[task.folder] ?? 0) + 1;
          return acc;
        }, {}),
    [allTasks],
  );
  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader caption="your folders" title="folders" underlineWidth={92} settingsButton />
      <DraggableFolderList
        folders={folders}
        noteCounts={noteCounts}
        taskCounts={taskCounts}
        onReorder={reorderFolders}
        onFolderPress={(id) => router.push(`/folder/${id}`)}
      />
      <FAB onPress={() => router.push('/folder/new')} />
    </View>
  );
}
