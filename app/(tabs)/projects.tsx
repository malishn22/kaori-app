import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNewProjectSheet } from '@/providers/NewProjectSheetProvider';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { Underline, FAB, GrainOverlay, ThemeText, HeaderText } from '@/components/ui';
import { IconChev, IconBookmarkFilled } from '@/assets/icons';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

export default function ProjectsScreen() {
  const router = useRouter();
  const { openNewProject } = useNewProjectSheet();
  const { colors } = useTheme();
  const { projects, ideas } = useStore();
  const ideaCounts = useMemo(
    () => ideas.reduce<Record<string, number>>((acc, idea) => {
      if (idea.project) acc[idea.project] = (acc[idea.project] ?? 0) + 1;
      return acc;
    }, {}),
    [ideas]
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
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.22,
                  shadowRadius: 14,
                  elevation: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  overflow: 'hidden',
                }}>
                  <GrainOverlay />
                  <View style={{
                    width: 42, height: 42, borderRadius: 12,
                    backgroundColor: `${p.color}1c`,
                    borderWidth: 1,
                    borderColor: `${p.color}33`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <ThemeText variant="heading" color={p.color}>
                      {p.name.charAt(0).toLowerCase()}
                    </ThemeText>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <ThemeText variant="title">
                      {p.name}
                    </ThemeText>
                    <ThemeText variant="meta" style={{ marginTop: 4 }}>
                      {ideaCounts[p.id] ?? 0} ideas · {p.updated}
                    </ThemeText>
                  </View>
                  {p.pinned && <IconBookmarkFilled size={13} color={colors.amber} />}
                  <IconChev size={14} color={colors.ink4} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <FAB onPress={() => openNewProject()} bottomOffset={TAB_BAR_BASE_HEIGHT} />
    </SafeAreaView>
  );
}
