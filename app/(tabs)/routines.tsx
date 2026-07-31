import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@/providers/StoreProvider';
import { RoutineCard, FAB, PageHeader, SectionTitle, EmptyState } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';
import { nextOccurrence } from '@/utils/time';

function nextFireMs(daysOfWeek: number[], reminderTime: string): number {
  if (daysOfWeek.length === 0) return Infinity;
  const [hour, minute] = reminderTime.split(':').map(Number);
  return Math.min(...daysOfWeek.map((d) => nextOccurrence(d, hour, minute).getTime()));
}

export default function RoutinesScreen() {
  const router = useRouter();
  const { routines: allRoutines, folders, toggleRoutineDone } = useStore();
  const insets = useSafeAreaInsets();

  const activeRoutines = useMemo(() => allRoutines.filter((r) => !r.archived), [allRoutines]);
  const pinnedRoutines = useMemo(() => activeRoutines.filter((r) => r.pinned), [activeRoutines]);

  const today = new Date().getDay();
  const todayRoutines = useMemo(
    () =>
      activeRoutines
        .filter((r) => !r.pinned && r.active && r.daysOfWeek.includes(today))
        .sort((a, b) => a.reminderTime.localeCompare(b.reminderTime)),
    [activeRoutines, today],
  );

  const otherRoutines = useMemo(
    () =>
      activeRoutines
        .filter((r) => !r.pinned && !todayRoutines.includes(r))
        .sort(
          (a, b) =>
            nextFireMs(a.daysOfWeek, a.reminderTime) - nextFireMs(b.daysOfWeek, b.reminderTime),
        ),
    [activeRoutines, todayRoutines],
  );

  if (activeRoutines.length === 0) {
    return <EmptyState variant="routines" onFAB={() => router.push('/routine/new')} />;
  }

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader settingsButton caption="all routines" title="routines" underlineWidth={78} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pinned */}
        {pinnedRoutines.length > 0 && (
          <View className="pt-7">
            <View className="px-6 pb-3">
              <SectionTitle underlineWidth={52}>pinned</SectionTitle>
            </View>
            <View className="px-[18px] gap-3">
              {pinnedRoutines.map((routine, i) => {
                const folder = folders.find((f) => f.id === routine.folder);
                return (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    folder={folder}
                    index={i}
                    onToggleDone={() => toggleRoutineDone(routine.id)}
                    onPress={() => router.push(`/routine/${routine.id}`)}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Today */}
        {todayRoutines.length > 0 && (
          <View className="pt-7">
            <View className="px-6 pb-3">
              <SectionTitle underlineWidth={48}>today</SectionTitle>
            </View>
            <View className="px-[18px] gap-3">
              {todayRoutines.map((routine, i) => {
                const folder = folders.find((f) => f.id === routine.folder);
                return (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    folder={folder}
                    index={i + 1}
                    onToggleDone={() => toggleRoutineDone(routine.id)}
                    onPress={() => router.push(`/routine/${routine.id}`)}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* All routines */}
        {otherRoutines.length > 0 && (
          <View className="pt-7">
            <View className="px-6 pb-3">
              <SectionTitle underlineWidth={64}>routines</SectionTitle>
            </View>
            <View className="px-[18px] gap-3">
              {otherRoutines.map((routine, i) => {
                const folder = folders.find((f) => f.id === routine.folder);
                return (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    folder={folder}
                    index={i + 2}
                    onToggleDone={() => toggleRoutineDone(routine.id)}
                    onPress={() => router.push(`/routine/${routine.id}`)}
                  />
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <FAB onPress={() => router.push('/routine/new')} />
    </View>
  );
}
