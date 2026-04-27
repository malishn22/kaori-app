import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { PaperCard, PageHeader, ThemeText } from '@/components/ui';

export default function NotesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { notes: allNotes, projects } = useStore();
  const notes = useMemo(() => allNotes.filter(n => !n.archived), [allNotes]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <PageHeader onBack={() => router.back()} caption="all notes" title="notes" subtitle={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`} underlineWidth={52} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {notes.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ThemeText variant="meta" color="ink4">no notes yet</ThemeText>
          </View>
        )}

        <View style={{ gap: 12 }}>
          {notes.map((note, i) => {
            const proj = note.project ? projects.find(p => p.id === note.project) : undefined;
            return (
              <TouchableOpacity key={note.id} onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                <PaperCard note={note} project={proj} index={i} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
