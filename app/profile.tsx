import React from 'react';
import { View, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useInlineEdit } from '@/hooks';
import { GrainOverlay, ThemeText, HeaderText, ScreenHeader, CustomSwitch, ProfileCard, SectionHeader, MenuRow } from '@/components/ui';
import { FONT } from '@/theme';
import { CloudIcon, ArrowIcon, FolderIcon } from '@/assets/icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, notes: allNotes, projects: allProjects, updateProfile } = useStore();
  const notes = allNotes.filter(n => !n.archived);
  const projects = allProjects.filter(p => !p.archived);

  const { editing, draft, setDraft, startEditing, commitEdit } = useInlineEdit({
    initialValue: profile.name,
    onSave: (name) => updateProfile({ name, initial: name[0].toLowerCase() }),
  });

  async function handleExport() {
    const exportText = notes.map(i => {
      const proj = projects.find(p => p.id === i.project)?.name ?? i.project;
      return `[${proj}] ${i.text}`;
    }).join('\n\n');
    await Share.share({ message: exportText });
  }

  const daysActive = (() => {
    if (!notes.length) return 0;
    const oldest = notes.reduce((min, i) => (i.createdAt < min ? i.createdAt : min), notes[0].createdAt);
    return Math.floor((Date.now() - new Date(oldest).getTime()) / 86_400_000);
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        <ProfileCard
          initial={profile.initial}
          name={profile.name}
          editing={editing}
          draft={draft}
          onChangeDraft={setDraft}
          onStartEditing={startEditing}
          onCommitEdit={commitEdit}
        />

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
          {[
            { val: allNotes.length, label: 'notes' },
            { val: projects.length, label: 'folders' },
            { val: daysActive, label: 'days' },
          ].map(({ val, label }) => (
            <View key={label} style={{
              flex: 1,
              backgroundColor: colors.paper,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.line,
              paddingVertical: 16,
              alignItems: 'center',
              gap: 4,
            }}>
              <HeaderText size={28} lineHeight={32}>{val}</HeaderText>
              <ThemeText variant="meta" color="ink3">{label}</ThemeText>
            </View>
          ))}
        </View>

        {/* Archived section */}
        <SectionHeader title="archived" underlineWidth={52} />
        <View style={{
          marginTop: 12,
          marginBottom: 28,
          backgroundColor: colors.paper,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.line,
          overflow: 'hidden',
        }}>
          <GrainOverlay />
          <MenuRow
            icon={<FolderIcon size={18} color={colors.ink3} strokeWidth={1.4} />}
            label="Archive"
            onPress={() => router.push('/archived')}
            borderBottom={false}
            showChevron
            gap={12}
          />
        </View>

        {/* Sync section */}
        <SectionHeader title="sync" underlineWidth={42} />
        <View style={{
          marginTop: 12,
          backgroundColor: colors.paper,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.line,
          paddingHorizontal: 16,
          overflow: 'hidden',
        }}>
          <GrainOverlay />

          <MenuRow
            icon={<CloudIcon size={18} color={colors.ink3} strokeWidth={1.4} />}
            label="cloud — synced"
            subtitle={`just now · all ${notes.length} notes`}
            right={<CustomSwitch value={true} />}
            paddingHorizontal={0}
            gap={12}
          />

          <MenuRow
            icon={<ArrowIcon size={18} color={colors.ink3} strokeWidth={1.4} />}
            label="export notes"
            onPress={handleExport}
            borderBottom={false}
            showChevron
            paddingHorizontal={0}
            gap={12}
          />
        </View>

        {/* Tagline */}
        <View style={{ alignItems: 'center', paddingTop: 36 }}>
          <ThemeText variant="meta" color="ink4" style={{ fontStyle: 'normal', fontFamily: FONT.kalam, fontSize: 16 }}>
            rest well, {profile.initial}.
          </ThemeText>
        </View>

      </ScrollView>
    </View>
  );
}
