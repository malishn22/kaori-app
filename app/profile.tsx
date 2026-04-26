import React, { useState } from 'react';
import { View, ScrollView, Share, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { GrainOverlay, ThemeText, HeaderText, Underline, ScreenHeader, CustomSwitch, TextInput } from '@/components/ui';
import { FONT } from '@/theme';
import { CloudIcon, ArrowIcon, ChevronIcon } from '@/assets/icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, ideas, projects, updateProfile } = useStore();

  async function handleExport() {
    const exportText = ideas.map(i => {
      const proj = projects.find(p => p.id === i.project)?.name ?? i.project;
      return `[${proj}] ${i.text}`;
    }).join('\n\n');
    await Share.share({ message: exportText });
  }
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.name);

  function startEditing() {
    setDraft(profile.name);
    setEditing(true);
  }

  function commitRename() {
    const trimmed = draft.trim();
    if (trimmed) updateProfile({ name: trimmed, initial: trimmed[0].toLowerCase() });
    setEditing(false);
  }

  const daysActive = (() => {
    if (!ideas.length) return 0;
    const oldest = ideas.reduce((min, i) => (i.createdAt < min ? i.createdAt : min), ideas[0].createdAt);
    return Math.floor((Date.now() - new Date(oldest).getTime()) / 86_400_000);
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={{
          backgroundColor: colors.paper,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.line,
          transform: [{ rotate: '-0.4deg' }],
          alignItems: 'center',
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <GrainOverlay />

          <LinearGradient
            colors={[colors.amber, colors.ink3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
          >
            <ThemeText variant="heading" size={36} color="bg">{profile.initial}</ThemeText>
          </LinearGradient>

          {editing ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              maxLength={30}
              autoFocus
              onBlur={commitRename}
              onSubmitEditing={commitRename}
              returnKeyType="done"
            />
          ) : (
            <TouchableOpacity onPress={startEditing} activeOpacity={0.7}>
              <HeaderText size={26} lineHeight={32}>{profile.name}</HeaderText>
            </TouchableOpacity>
          )}

          {!editing && (
            <ThemeText variant="meta" color="ink4" style={{ marginTop: 6 }}>tap your name to rename</ThemeText>
          )}
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
          {[
            { val: ideas.length, label: 'ideas' },
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

        {/* Sync section */}
        <ThemeText variant="subheading" style={{ marginBottom: 6 }}>sync</ThemeText>
        <Underline width={42} />
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

          {/* Cloud row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <CloudIcon size={18} color={colors.ink3} strokeWidth={1.4} />
            <View style={{ flex: 1 }}>
              <ThemeText variant="label">cloud — synced</ThemeText>
              <ThemeText variant="meta" color="ink4" style={{ marginTop: 2 }}>just now · all {ideas.length} ideas</ThemeText>
            </View>
            <CustomSwitch value={true} />
          </View>

          {/* Export row */}
          <TouchableOpacity onPress={handleExport} activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
            <ArrowIcon size={18} color={colors.ink3} strokeWidth={1.4} />
            <ThemeText variant="label" style={{ flex: 1 }}>export ideas</ThemeText>
            <ChevronIcon size={12} color={colors.ink4} />
          </TouchableOpacity>
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
