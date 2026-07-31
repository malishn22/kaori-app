import React from 'react';
import { View, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useInlineEdit, useActiveFolders } from '@/hooks';
import {
  GrainOverlay,
  ThemeText,
  HeaderText,
  PageHeader,
  CustomSwitch,
  ProfileCard,
  SectionTitle,
  MenuRow,
} from '@/components/ui';
import { CloudIcon, ArrowIcon, FolderIcon } from '@/assets/icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    profile,
    notes: allNotes,
    tasks: allTasks,
    routines: allRoutines,
    folders: allFolders,
    updateProfile,
  } = useStore();
  const notes = allNotes.filter((n) => !n.archived);
  const folders = useActiveFolders();

  const { editing, draft, setDraft, startEditing, commitEdit } = useInlineEdit({
    initialValue: profile.name,
    onSave: (name) => updateProfile({ name, initial: name[0].toLowerCase() }),
  });

  async function handleExport() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      folders: allFolders.map(({ id, name, color, note, createdAt, pinned, archived, order }) => ({
        id,
        name,
        color,
        note,
        createdAt,
        pinned,
        archived,
        order,
      })),
      notes: allNotes.map(
        ({ id, folder, text, time, date, createdAt, tags, pinned, links, archived }) => ({
          id,
          folder,
          text,
          time,
          date,
          createdAt,
          tags,
          pinned,
          links,
          archived,
        }),
      ),
      tasks: allTasks.map(
        ({ id, folder, title, dueDate, reminderAt, done, createdAt, pinned, links, archived }) => ({
          id,
          folder,
          title,
          dueDate,
          reminderAt,
          done,
          createdAt,
          pinned,
          links,
          archived,
        }),
      ),
      routines: allRoutines.map(
        ({
          id,
          folder,
          title,
          daysOfWeek,
          reminderTime,
          active,
          createdAt,
          pinned,
          archived,
          completions,
          links,
        }) => ({
          id,
          folder,
          title,
          daysOfWeek,
          reminderTime,
          active,
          createdAt,
          pinned,
          archived,
          completions,
          links,
        }),
      ),
      profile,
    };
    await Share.share({ message: JSON.stringify(exportData, null, 2) });
  }

  const daysActive = (() => {
    if (!notes.length) return 0;
    const oldest = notes.reduce(
      (min, i) => (i.createdAt < min ? i.createdAt : min),
      notes[0].createdAt,
    );
    return Math.floor((Date.now() - new Date(oldest).getTime()) / 86_400_000);
  })();

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
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
        <View className="gap-2.5 mb-7">
          <View className="flex-row gap-2.5">
            {[
              { val: allNotes.length, label: 'notes' },
              { val: allTasks.length, label: 'tasks' },
              { val: allRoutines.length, label: 'routines' },
            ].map(({ val, label }) => (
              <View
                key={label}
                className="flex-1 bg-theme-paper rounded-[14px] border border-theme-line py-4 items-center gap-1"
              >
                <HeaderText size={28} lineHeight={32}>
                  {val}
                </HeaderText>
                <ThemeText variant="meta" color="ink3">
                  {label}
                </ThemeText>
              </View>
            ))}
          </View>
          <View className="flex-row gap-2.5">
            {[
              { val: folders.length, label: 'folders' },
              { val: daysActive, label: 'days' },
            ].map(({ val, label }) => (
              <View
                key={label}
                className="flex-1 bg-theme-paper rounded-[14px] border border-theme-line py-4 items-center gap-1"
              >
                <HeaderText size={28} lineHeight={32}>
                  {val}
                </HeaderText>
                <ThemeText variant="meta" color="ink3">
                  {label}
                </ThemeText>
              </View>
            ))}
          </View>
        </View>

        {/* Archived section */}
        <SectionTitle underlineWidth={52}>archived</SectionTitle>
        <View className="mt-3 mb-7 bg-theme-paper rounded-[14px] border border-theme-line overflow-hidden">
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
        <SectionTitle underlineWidth={42}>sync</SectionTitle>
        <View className="mt-3 bg-theme-paper rounded-[14px] border border-theme-line px-4 overflow-hidden">
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
            label="export data"
            onPress={handleExport}
            borderBottom={false}
            showChevron
            paddingHorizontal={0}
            gap={12}
          />
        </View>

        {/* Tagline */}
        <View className="items-center pt-9">
          <ThemeText
            variant="meta"
            color="ink4"
            style={{ fontStyle: 'normal', fontFamily: FONT.kalam, fontSize: 16 }}
          >
            rest well, {profile.initial}.
          </ThemeText>
        </View>
      </ScrollView>
    </View>
  );
}
