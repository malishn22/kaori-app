import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback } from '@/hooks';
import { GrainOverlay, ThemeText, HeaderText, Underline, ScreenHeader, PaperCard, ProjectAvatar } from '@/components/ui';
import { ChevronIcon } from '@/assets/icons';
import { SHADOW_CARD } from '@/constants';

export default function ArchivedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { notes, projects, archiveNote, archiveProject } = useStore();
  const { impact } = useHapticFeedback();

  const archivedProjects = projects.filter(p => p.archived);
  const archivedNotes = notes.filter(n => n.archived);

  async function handleUnarchiveProject(id: string) {
    await archiveProject(id, false);
    impact();
  }

  async function handleUnarchiveNote(id: string) {
    await archiveNote(id, false);
    impact();
  }

  const empty = archivedProjects.length === 0 && archivedNotes.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <ScreenHeader onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 6, marginBottom: 24 }}>
          <ThemeText variant="caption" letterSpacing={0.6}>hidden items</ThemeText>
          <HeaderText style={{ marginTop: 6 }}>archived</HeaderText>
          <Underline width={62} />
        </View>

        {empty && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ThemeText variant="meta" color="ink4">nothing archived</ThemeText>
          </View>
        )}

        {/* Archived projects */}
        {archivedProjects.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
              <ThemeText variant="subheading">projects</ThemeText>
              <Underline width={52} />
            </View>

            <View style={{ gap: 12 }}>
              {archivedProjects.map((p, i) => {
                const noteCount = notes.filter(n => n.project === p.id).length;
                const tilt = i % 2 === 0 ? -0.4 : 0.3;
                return (
                  <View
                    key={p.id}
                    style={{
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
                    }}
                  >
                    <GrainOverlay />
                    <ProjectAvatar name={p.name} color={p.color} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <ThemeText variant="title">{p.name}</ThemeText>
                      <ThemeText variant="meta" style={{ marginTop: 4 }}>{noteCount} notes</ThemeText>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnarchiveProject(p.id)}
                      activeOpacity={0.7}
                      hitSlop={8}
                      style={{
                        backgroundColor: colors.bg,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderWidth: 1,
                        borderColor: colors.line,
                      }}
                    >
                      <ThemeText variant="meta" size={12} color="amber">restore</ThemeText>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Archived notes */}
        {archivedNotes.length > 0 && (
          <View>
            <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
              <ThemeText variant="subheading">notes</ThemeText>
              <Underline width={38} />
            </View>

            <View style={{ gap: 12 }}>
              {archivedNotes.map((note, i) => {
                const proj = note.project ? projects.find(p => p.id === note.project) : undefined;
                return (
                  <View key={note.id} style={{ position: 'relative' }}>
                    <TouchableOpacity onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                      <PaperCard note={note} project={proj} index={i} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUnarchiveNote(note.id)}
                      activeOpacity={0.7}
                      hitSlop={8}
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 12,
                        backgroundColor: colors.bg,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderWidth: 1,
                        borderColor: colors.line,
                      }}
                    >
                      <ThemeText variant="meta" size={12} color="amber">restore</ThemeText>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
