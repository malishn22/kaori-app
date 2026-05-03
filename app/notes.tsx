import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useStore } from '@/providers/StoreProvider';
import { NoteCard, PageHeader, ThemeText, SectionTitle, SwipeablePinWrapper } from '@/components/ui';

export default function NotesScreen() {
  const router = useRouter();
  const { notes: allNotes, folders, updateNote } = useStore();
  const notes = useMemo(() => allNotes.filter(n => !n.archived), [allNotes]);
  const pinnedNotes = useMemo(() => notes.filter(n => n.pinned), [notes]);
  const unpinnedNotes = useMemo(() => notes.filter(n => !n.pinned), [notes]);

  return (
    <View className="flex-1 bg-theme-bg">
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <PageHeader onBack={() => router.back()} caption="all notes" title="notes" subtitle={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`} underlineWidth={52} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {notes.length === 0 && (
          <View className="items-center pt-[60px]">
            <ThemeText variant="meta" color="ink4">no notes yet</ThemeText>
          </View>
        )}

        {/* Pinned */}
        {pinnedNotes.length > 0 && (
          <View>
            <View className="pb-3">
              <SectionTitle underlineWidth={52}>pinned</SectionTitle>
            </View>
            <View className="gap-3">
              {pinnedNotes.map((note, i) => {
                const folder = note.folder ? folders.find(f => f.id === note.folder) : undefined;
                return (
                  <SwipeablePinWrapper key={note.id} isPinned={note.pinned} onTogglePin={() => updateNote(note.id, { pinned: !note.pinned })}>
                    <TouchableOpacity onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                      <NoteCard note={note} folder={folder} index={i} />
                    </TouchableOpacity>
                  </SwipeablePinWrapper>
                );
              })}
            </View>
          </View>
        )}

        {/* Notes */}
        {unpinnedNotes.length > 0 && (
          <View className={pinnedNotes.length > 0 ? 'pt-7' : ''}>
            <View className="pb-3">
              <SectionTitle underlineWidth={48}>notes</SectionTitle>
            </View>
            <View className="gap-3">
              {unpinnedNotes.map((note, i) => {
                const folder = note.folder ? folders.find(f => f.id === note.folder) : undefined;
                return (
                  <SwipeablePinWrapper key={note.id} isPinned={note.pinned} onTogglePin={() => updateNote(note.id, { pinned: !note.pinned })}>
                    <TouchableOpacity onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                      <NoteCard note={note} folder={folder} index={i} />
                    </TouchableOpacity>
                  </SwipeablePinWrapper>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
