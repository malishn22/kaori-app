import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNewNoteSheet } from '@/providers/NewNoteSheetProvider';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { getTimeOfDay, getDayName } from '@/utils/time';
import { PaperCard, Underline, FAB, ThemeText, HeaderText, SectionLabel, SettingsButton } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';
import { SHADOW_EMPTY } from '@/constants';

export default function HomeScreen() {
  const router = useRouter();
  const { openNewNote } = useNewNoteSheet();
  const { colors } = useTheme();
  const { notes: allNotes, projects, profile } = useStore();
  const insets = useSafeAreaInsets();
  const notes = useMemo(() => allNotes.filter(n => !n.archived), [allNotes]);

  const timeOfDay = getTimeOfDay();
  const dayName = getDayName();
  const todayCount = notes.filter(i => i.date === 'today').length;
  const yesterdayCount = notes.filter(i => i.date === 'yesterday').length;

  if (notes.length === 0) {
    return <EmptyState onFAB={() => openNewNote()} />;
  }

  const subtitleParts = [];
  if (todayCount > 0) subtitleParts.push(`${todayCount} ${todayCount === 1 ? 'note' : 'notes'} waiting`);
  if (yesterdayCount > 0) subtitleParts.push(`${yesterdayCount} from yesterday`);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(', ') + '.' : 'nothing yet today.';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <SettingsButton />
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <ThemeText variant="caption" letterSpacing={0.5}>
            {dayName}
          </ThemeText>
          <HeaderText size={38} lineHeight={42} style={{ marginTop: 8 }}>
            {timeOfDay}, <HeaderText size={38} lineHeight={42} color="amber">{profile.initial}.</HeaderText>
          </HeaderText>
          <Underline width={92} />
          <ThemeText variant="meta" size={13} color="ink2" style={{ marginTop: 6, lineHeight: 20 }}>
            {subtitle}
          </ThemeText>
        </View>

        {/* Recent Notes */}
        <View style={{ paddingTop: 28 }}>
          <View style={{ paddingHorizontal: 24, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View>
              <SectionLabel>recent notes</SectionLabel>
              <Underline width={72} />
            </View>
            <ThemeText variant="meta">see all</ThemeText>
          </View>

          <View style={{ paddingHorizontal: 18, gap: 12 }}>
            {notes.slice(0, 4).map((note, i) => {
              const proj = projects.find(p => p.id === note.project);
              return (
                <TouchableOpacity key={note.id} onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                  <PaperCard note={note} project={proj} index={i} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <FAB onPress={() => openNewNote()}  />
    </SafeAreaView>
  );
}

function EmptyState({ onFAB }: { onFAB: () => void }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <SettingsButton />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: -80 }}>
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

        <HeaderText size={32} lineHeight={38} style={{ textAlign: 'center' }}>
          your notebook{'\n'}is <HeaderText size={32} lineHeight={38} color="amber">empty</HeaderText>.
        </HeaderText>
        <ThemeText variant="meta" size={13.5} color="ink2" style={{ lineHeight: 21, textAlign: 'center', marginTop: 14, maxWidth: 290 }}>
          tap the button below to write your first note. 
        </ThemeText>
      </View>
      <FAB onPress={onFAB} wide label="first note"  />
    </SafeAreaView>
  );
}
