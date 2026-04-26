import React from 'react';
import { View, ScrollView, TouchableOpacity, Switch, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useSettingSheet } from '@/providers/SettingSheetProvider';
import { Underline, GrainOverlay, ThemeText, HeaderText, ColorDot } from '@/components/ui';
import {
  IconMoon, IconSparkle,
  IconFolder, IconBell, IconCloud, IconArrow, IconChev,
} from '@/assets/icons';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

export default function SettingsScreen() {
  const { colors, settings, setSetting } = useTheme();
  const { ideas, projects, profile } = useStore();
  const { setOpenSheet } = useSettingSheet();
  const insets = useSafeAreaInsets();

  const defaultFolderName = projects.find(p => p.id === profile.defaultProject)?.name ?? 'inbox';

  async function handleExport() {
    const exportText = ideas.map(i => {
      const proj = projects.find(p => p.id === i.project)?.name ?? i.project;
      return `[${proj}] ${i.text}`;
    }).join('\n\n');
    await Share.share({ message: exportText });
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <ThemeText variant="caption">
            your space
          </ThemeText>
          <HeaderText style={{ marginTop: 6 }}>settings</HeaderText>
          <Underline width={92} />
        </View>

        {/* Profile card */}
        <View style={{ paddingHorizontal: 18, paddingTop: 24 }}>
          <View style={{
            backgroundColor: colors.paper,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.line,
            transform: [{ rotate: '-0.4deg' }],
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            overflow: 'hidden',
          }}>
            <GrainOverlay />
            <LinearGradient
              colors={[colors.amber, colors.ink3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
            >
              <ThemeText variant="heading" size={26} color="bg">{profile.initial}</ThemeText>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <ThemeText variant="heading" lineHeight={26}>{profile.name}</ThemeText>
              <ThemeText variant="meta" style={{ marginTop: 4 }}>
                {ideas.length} ideas · {projects.length} folders
              </ThemeText>
            </View>
          </View>
        </View>

        {/* FEEL section */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <ThemeText variant="subheading" style={{ marginBottom: 6 }}>feel</ThemeText>
          <Underline width={42} />
          <View style={{ marginTop: 12 }}>

            <TouchableOpacity onPress={() => setOpenSheet('tone')} activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <IconMoon size={17} color={colors.ink3} strokeWidth={1.4} />
              <ThemeText variant="label" style={{ flex: 1 }}>theme</ThemeText>
              <ThemeText variant="meta" size={13}>{settings.tone}</ThemeText>
              <IconChev size={12} color={colors.ink4} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setOpenSheet('accent')} activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <IconSparkle size={17} color={colors.ink3} />
              <ThemeText variant="label" style={{ flex: 1 }}>accent</ThemeText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ColorDot color={colors.amber} size={10} />
                <ThemeText variant="meta" size={13}>{settings.accent}</ThemeText>
              </View>
              <IconChev size={12} color={colors.ink4} />
            </TouchableOpacity>

          </View>
        </View>

        {/* CAPTURE section */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <ThemeText variant="subheading" style={{ marginBottom: 6 }}>capture</ThemeText>
          <Underline width={42} />
          <View style={{ marginTop: 12 }}>

            <TouchableOpacity onPress={() => setOpenSheet('folder')} activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <IconFolder size={17} color={colors.ink3} strokeWidth={1.4} />
              <ThemeText variant="label" style={{ flex: 1 }}>default folder</ThemeText>
              <ThemeText variant="meta" size={13}>{defaultFolderName}</ThemeText>
              <IconChev size={12} color={colors.ink4} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 }}>
              <IconBell size={17} color={colors.ink3} strokeWidth={1.4} />
              <ThemeText variant="label" style={{ flex: 1 }}>haptic on save</ThemeText>
              <Switch
                value={settings.hapticOnSave}
                onValueChange={(v) => setSetting('hapticOnSave', v)}
                trackColor={{ false: colors.ink4, true: colors.amber }}
                thumbColor={colors.cream}
                ios_backgroundColor={colors.ink4}
              />
            </View>
          </View>
        </View>

        {/* DATA section */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <ThemeText variant="subheading" style={{ marginBottom: 6 }}>data</ThemeText>
          <Underline width={42} />
          <View style={{ marginTop: 12 }}>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <IconCloud size={17} color={colors.ink3} strokeWidth={1.4} />
              <ThemeText variant="label" style={{ flex: 1 }}>sync</ThemeText>
              <ThemeText variant="meta" size={13}>local</ThemeText>
            </View>

            <TouchableOpacity onPress={handleExport} activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 }}>
              <IconArrow size={17} color={colors.ink3} strokeWidth={1.4} />
              <ThemeText variant="label" style={{ flex: 1 }}>export ideas</ThemeText>
              <IconChev size={12} color={colors.ink4} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingTop: 36, paddingBottom: 24 }}>
          <ThemeText variant="meta" color="ink4">
            <ThemeText variant="subheading" color="ink3">kaori</ThemeText>
            {' · v1.0.0'}
          </ThemeText>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}
