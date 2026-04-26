import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useProjectIdeas } from '@/hooks';
import { useNewNoteSheet } from '@/providers/NewNoteSheetProvider';
import { useProjectMenuSheet } from '@/providers/ProjectMenuSheetProvider';
import { PaperCard, FAB, GrainOverlay, ThemeText, HeaderText, ColorDot, ScreenHeader, ShowMoreButton } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { proj, ideas, ideasThisWeek, pinnedCount } = useProjectIdeas(id);
  const { openNewNote } = useNewNoteSheet();
  const { openProjectMenu } = useProjectMenuSheet();

  if (!proj) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        onBack={() => router.back()}
        rightActions={[
          { icon: <ShowMoreButton color={colors.ink2} onPress={() => openProjectMenu(proj.id, () => router.back())} /> },
        ]}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 220 }} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={{ paddingHorizontal: 18, paddingTop: 20 }}>
          <View style={{
            backgroundColor: colors.paper2,
            borderRadius: 22,
            padding: 28,
            paddingBottom: 24,
            borderWidth: 1,
            borderColor: colors.line2,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <GrainOverlay />
            {/* Folded corner */}
            <View style={{
              position: 'absolute', top: 0, right: 0, width: 36, height: 36,
              backgroundColor: 'transparent',
              borderTopRightRadius: 22,
              overflow: 'hidden',
            }}>
              <View style={{
                position: 'absolute', top: 0, right: 0,
                width: 36, height: 36,
                backgroundColor: 'rgba(232,200,154,0.12)',
                transform: [{ rotate: '45deg' }, { translateX: 18 }],
              }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ColorDot color={proj.color} size={10} />
              <ThemeText variant="caption" size={11}>
                folder
              </ThemeText>
            </View>
            <HeaderText size={32} lineHeight={36}>{proj.name}</HeaderText>
            <ThemeText variant="meta" size={13} color="ink2" style={{ marginTop: 12, lineHeight: 20 }}>
              {proj.note}.
            </ThemeText>
            <View style={{ flexDirection: 'row', gap: 18, marginTop: 18 }}>
              {[
                { val: ideas.length, label: 'ideas' },
                { val: ideasThisWeek, label: 'this week' },
                { val: pinnedCount, label: 'pinned' },
              ].map(({ val, label }) => (
                <ThemeText key={label} variant="meta">
                  <ThemeText variant="chip" color="cream" size={16}>{val} </ThemeText>
                  {label}
                </ThemeText>
              ))}
            </View>
          </View>
        </View>

        {/* Ideas list */}
        <View style={{ paddingHorizontal: 18, paddingTop: 24, gap: 12 }}>
          {ideas.map((idea, ix) => (
            <TouchableOpacity key={idea.id} onPress={() => router.push(`/idea/${idea.id}`)} activeOpacity={0.85}>
              <PaperCard idea={idea} project={proj} index={ix + 1} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FAB onPress={() => openNewNote(proj.id)} bottomGap={TAB_BAR_BASE_HEIGHT} />
    </View>
  );
}
