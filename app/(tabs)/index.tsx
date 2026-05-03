import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@/providers/StoreProvider';
import { getTimeOfDay, getDayName } from '@/utils/time';
import { NoteCard, FAB, ThemeText, SectionTitle, PageHeader, GreetingTitle, EmptyState } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

export default function HomeScreen() {
  const router = useRouter();
  const { notes: allNotes, folders, profile } = useStore();
  const insets = useSafeAreaInsets();
  const notes = useMemo(() => allNotes.filter(n => !n.archived), [allNotes]);
  const pinnedNotes = useMemo(() => notes.filter(n => n.pinned), [notes]);

  const timeOfDay = getTimeOfDay();
  const dayName = getDayName();
  const todayCount = notes.filter(i => i.date === 'today').length;
  const yesterdayCount = notes.filter(i => i.date === 'yesterday').length;

  if (notes.length === 0) {
    return <EmptyState variant="notes" onFAB={() => router.push('/note/new')} />;
  }

  const subtitleParts = [];
  if (todayCount > 0) subtitleParts.push(`${todayCount} ${todayCount === 1 ? 'note' : 'notes'} waiting`);
  if (yesterdayCount > 0) subtitleParts.push(`${yesterdayCount} from yesterday`);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(', ') + '.' : 'nothing yet today.';

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader
        settingsButton
        caption={dayName}
        titleElement={<GreetingTitle timeOfDay={timeOfDay} initial={profile.initial} />}
        subtitle={subtitle}
        underlineWidth={92}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <View className="pt-7">
            <View className="px-6 pb-3">
              <SectionTitle underlineWidth={52}>pinned</SectionTitle>
            </View>

            <View className="px-[18px] gap-3">
              {pinnedNotes.map((note, i) => {
                const folder = folders.find(f => f.id === note.folder);
                return (
                  <TouchableOpacity key={note.id} onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                    <NoteCard note={note} folder={folder} index={i} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Notes */}
        <View className="pt-7">
          <View className="px-6 pb-3 flex-row items-end justify-between">
            <View>
              <SectionTitle underlineWidth={72}>notes</SectionTitle>
            </View>
            <TouchableOpacity onPress={() => router.push('/notes')} activeOpacity={0.7} hitSlop={8}>
              <ThemeText variant="meta">see all</ThemeText>
            </TouchableOpacity>
          </View>

          <View className="px-[18px] gap-3">
            {notes.slice(0, 4).map((note, i) => {
              const folder = folders.find(f => f.id === note.folder);
              return (
                <TouchableOpacity key={note.id} onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                  <NoteCard note={note} folder={folder} index={i} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <FAB onPress={() => router.push('/note/new')}  />
    </View>
  );
}
