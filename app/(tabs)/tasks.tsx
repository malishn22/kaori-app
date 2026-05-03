import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@/providers/StoreProvider';
import { TaskCard, FAB, PageHeader, SectionTitle, EmptyState } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

export default function TasksScreen() {
  const router = useRouter();
  const { tasks: allTasks, folders, toggleTask } = useStore();
  const insets = useSafeAreaInsets();
  const activeTasks = useMemo(() => allTasks.filter(t => !t.archived && !t.done), [allTasks]);
  const pinnedTasks = useMemo(() => activeTasks.filter(t => t.pinned), [activeTasks]);
  const unpinnedTasks = useMemo(() => activeTasks.filter(t => !t.pinned), [activeTasks]);

  if (activeTasks.length === 0) {
    return <EmptyState variant="tasks" onFAB={() => router.push('/task/new')} />;
  }

  const subtitle = `${activeTasks.length} open.`;

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader
        settingsButton
        caption="all tasks"
        title="tasks"
        subtitle={subtitle}
        underlineWidth={62}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pinned */}
        {pinnedTasks.length > 0 && (
          <View className="pt-7">
            <View className="px-6 pb-3">
              <SectionTitle underlineWidth={52}>pinned</SectionTitle>
            </View>
            <View className="px-[18px] gap-3">
              {pinnedTasks.map((task, i) => {
                const folder = folders.find(f => f.id === task.folder);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    folder={folder}
                    index={i}
                    onToggle={() => toggleTask(task.id)}
                    onPress={() => router.push(`/task/${task.id}`)}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Tasks */}
        {unpinnedTasks.length > 0 && (
          <View className="pt-7">
            <View className="px-6 pb-3">
              <SectionTitle underlineWidth={48}>tasks</SectionTitle>
            </View>
            <View className="px-[18px] gap-3">
              {unpinnedTasks.map((task, i) => {
                const folder = folders.find(f => f.id === task.folder);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    folder={folder}
                    index={i + 1}
                    onToggle={() => toggleTask(task.id)}
                    onPress={() => router.push(`/task/${task.id}`)}
                  />
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      <FAB onPress={() => router.push('/task/new')} />
    </View>
  );
}
