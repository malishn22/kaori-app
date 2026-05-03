import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { TaskCard, FAB, PageHeader, SectionTitle, ThemeText, HeaderText } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';
import { SHADOW_EMPTY } from '@/constants';

export default function TasksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { tasks: allTasks, folders, toggleTask } = useStore();
  const insets = useSafeAreaInsets();
  const activeTasks = useMemo(() => allTasks.filter(t => !t.archived && !t.done), [allTasks]);
  const pinnedTasks = useMemo(() => activeTasks.filter(t => t.pinned), [activeTasks]);
  const unpinnedTasks = useMemo(() => activeTasks.filter(t => !t.pinned), [activeTasks]);

  if (activeTasks.length === 0) {
    return <EmptyState onFAB={() => router.push('/task/new')} />;
  }

  const subtitle = `${activeTasks.length} open.`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
          <View style={{ paddingTop: 28 }}>
            <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
              <SectionTitle underlineWidth={52}>pinned</SectionTitle>
            </View>
            <View style={{ paddingHorizontal: 18, gap: 12 }}>
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
          <View style={{ paddingTop: 28 }}>
            <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
              <SectionTitle underlineWidth={48}>tasks</SectionTitle>
            </View>
            <View style={{ paddingHorizontal: 18, gap: 12 }}>
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

function EmptyState({ onFAB }: { onFAB: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader settingsButton />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 80 }}>
        {/* Tilted checkbox card */}
        <View style={{
          width: 220, height: 280,
          backgroundColor: colors.paper,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.line2,
          transform: [{ rotate: '-3deg' }],
          ...SHADOW_EMPTY,
          overflow: 'hidden',
          marginBottom: 32,
        }}>
          {[0.6, 0.75, 0.5, 0.65, 0.45].map((w, i) => (
            <View key={i} style={{
              position: 'absolute',
              top: 24 + i * 42,
              left: 22,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
              <View style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                borderWidth: 1.2,
                borderColor: colors.line2,
              }} />
              <View style={{
                width: `${w * 100}%` as any,
                height: 1,
                backgroundColor: colors.line2,
              }} />
            </View>
          ))}
          <ThemeText variant="heading" size={28} color="amber" style={{
            position: 'absolute', bottom: 28, right: 28,
            opacity: 0.35,
            transform: [{ rotate: '-8deg' }],
          }}>—</ThemeText>
        </View>

        <HeaderText size={32} lineHeight={38} style={{ textAlign: 'center' }}>tasks</HeaderText>
        <HeaderText size={32} lineHeight={38} color="amber" style={{ textAlign: 'center' }}>empty</HeaderText>
      </View>
      <FAB onPress={onFAB} wide label="first task" />
    </View>
  );
}
