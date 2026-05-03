import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { getTimeOfDay, getDayName } from '@/utils/time';
import { NoteCard, FAB, ThemeText, HeaderText, SectionTitle, PageHeader, GreetingTitle } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';
import { SHADOW_EMPTY } from '@/constants';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { notes: allNotes, folders, profile } = useStore();
  const insets = useSafeAreaInsets();
  const notes = useMemo(() => allNotes.filter(n => !n.archived), [allNotes]);
  const pinnedNotes = useMemo(() => notes.filter(n => n.pinned), [notes]);

  const timeOfDay = getTimeOfDay();
  const dayName = getDayName();
  const todayCount = notes.filter(i => i.date === 'today').length;
  const yesterdayCount = notes.filter(i => i.date === 'yesterday').length;

  if (notes.length === 0) {
    return <EmptyState onFAB={() => router.push('/note/new')} />;
  }

  const subtitleParts = [];
  if (todayCount > 0) subtitleParts.push(`${todayCount} ${todayCount === 1 ? 'note' : 'notes'} waiting`);
  if (yesterdayCount > 0) subtitleParts.push(`${yesterdayCount} from yesterday`);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(', ') + '.' : 'nothing yet today.';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
          <View style={{ paddingTop: 28 }}>
            <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
              <SectionTitle underlineWidth={52}>pinned</SectionTitle>
            </View>

            <View style={{ paddingHorizontal: 18, gap: 12 }}>
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
        <View style={{ paddingTop: 28 }}>
          <View style={{ paddingHorizontal: 24, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View>
              <SectionTitle underlineWidth={72}>notes</SectionTitle>
            </View>
            <TouchableOpacity onPress={() => router.push('/notes')} activeOpacity={0.7} hitSlop={8}>
              <ThemeText variant="meta">see all</ThemeText>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 18, gap: 12 }}>
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

function EmptyState({ onFAB }: { onFAB: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader settingsButton />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 80 }}>
        {/* Blank tilted paper */}
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
          {[0.6, 0.85, 0.4, 0.7, 0.55].map((w, i) => (
            <View key={i} style={{
              position: 'absolute',
              top: 24 + i * 34,
              left: 22,
              width: `${w * 100}%` as any,
              height: 1,
              backgroundColor: colors.line2,
            }} />
          ))}
          <ThemeText variant="heading" size={28} color="amber" style={{
            position: 'absolute', bottom: 28, right: 28,
            opacity: 0.35,
            transform: [{ rotate: '-8deg' }],
          }}>—</ThemeText>
        </View>

        <HeaderText size={32} lineHeight={38} style={{ textAlign: 'center' }}>notebook</HeaderText>
        <HeaderText size={32} lineHeight={38} color="amber" style={{ textAlign: 'center' }}>empty</HeaderText>
      </View>
      <FAB onPress={onFAB} wide label="first note"  />
    </View>
  );
}
