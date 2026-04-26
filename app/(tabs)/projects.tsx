import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNewProjectSheet } from '@/providers/NewProjectSheetProvider';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { Underline, FAB, GrainOverlay, ThemeText, HeaderText, ProjectAvatar } from '@/components/ui';
import { ChevronIcon, BookmarkIcon } from '@/assets/icons';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';
import { SHADOW_CARD } from '@/constants';

export default function ProjectsScreen() {
  const router = useRouter();
  const { openNewProject } = useNewProjectSheet();
  const { colors } = useTheme();
  const { projects, notes } = useStore();
  const noteCounts = useMemo(
    () => notes.reduce<Record<string, number>>((acc, note) => {
      if (note.project) acc[note.project] = (acc[note.project] ?? 0) + 1;
      return acc;
    }, {}),
    [notes]
  );
  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [projects]
  );
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <ThemeText variant="caption" letterSpacing={0.6}>
            your folders
          </ThemeText>
          <HeaderText style={{ marginTop: 6 }}>projects</HeaderText>
          <Underline width={92} />
        </View>

        <View style={{ paddingHorizontal: 18, paddingTop: 24, gap: 14 }}>
          {sortedProjects.map((p, i) => {
            const tilt = i % 2 === 0 ? -0.5 : 0.4;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => router.push(`/project/${p.id}`)}
                activeOpacity={0.85}
              >
                <View style={{
                  backgroundColor: colors.paper,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.line,
                  transform: [{ rotate: `${tilt}deg` }],
                  ...SHADOW_CARD,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  overflow: 'hidden',
                }}>
                  <GrainOverlay />
                  <ProjectAvatar name={p.name} color={p.color} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <ThemeText variant="title">
                      {p.name}
                    </ThemeText>
                    <ThemeText variant="meta" style={{ marginTop: 4 }}>
                      {noteCounts[p.id] ?? 0} notes · {p.updated}
                    </ThemeText>
                  </View>
                  {p.pinned && <BookmarkIcon size={13} color={colors.amber} fill={colors.amber} />}
                  <ChevronIcon size={14} color={colors.ink4} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <FAB onPress={() => openNewProject()}  />
    </SafeAreaView>
  );
}
