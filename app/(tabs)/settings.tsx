import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useSettingSheet } from '@/providers/SettingSheetProvider';
import { GrainOverlay, ThemeText, ColorDot, SettingRow, CustomSwitch, SectionTitle, PageHeader } from '@/components/ui';
import {
  MoonIcon, SparkleIcon,
  BellIcon, ChevronIcon,
} from '@/assets/icons';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, settings, setSetting } = useTheme();
  const { notes, folders, tasks, profile } = useStore();
  const { setOpenSheet } = useSettingSheet();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader caption="your space" title="settings" underlineWidth={92} />
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180 }} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View className="px-[18px] pt-6">
          <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.85}>
          <View
            className="bg-theme-paper rounded-2xl p-[18px] border border-theme-line flex-row items-center gap-3.5 overflow-hidden"
            style={{ transform: [{ rotate: '-0.4deg' }] }}
          >
            <GrainOverlay />
            <LinearGradient
              colors={[colors.amber, colors.ink3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="size-12 rounded-[14px] items-center justify-center"
            >
              <ThemeText variant="heading" size={26} color="bg">{profile.initial}</ThemeText>
            </LinearGradient>
            <View className="flex-1">
              <ThemeText variant="heading" lineHeight={26}>{profile.name}</ThemeText>
              <ThemeText variant="meta" style={{ marginTop: 4 }}>
                {notes.length} notes · {tasks.length} tasks · {folders.length} folders
              </ThemeText>
            </View>
          </View>
          </TouchableOpacity>
        </View>

        {/* FEEL section */}
        <View className="px-6 pt-6">
          <SectionTitle underlineWidth={42}>feel</SectionTitle>
          <View className="mt-3">

            <SettingRow
              icon={<MoonIcon size={17} color={colors.ink3} strokeWidth={1.4} />}
              label="theme"
              right={<>
                <ThemeText variant="meta" size={13}>{settings.tone}</ThemeText>
                <ChevronIcon size={12} color={colors.ink4} />
              </>}
              onPress={() => setOpenSheet('tone')}
              borderBottom
            />

            <SettingRow
              icon={<SparkleIcon size={17} color={colors.ink3} />}
              label="accent"
              right={<>
                <View className="flex-row items-center gap-2">
                  <ColorDot color={colors.amber} size={10} />
                  <ThemeText variant="meta" size={13}>{settings.accent}</ThemeText>
                </View>
                <ChevronIcon size={12} color={colors.ink4} />
              </>}
              onPress={() => setOpenSheet('accent')}
              borderBottom
            />

          </View>
        </View>

        {/* CAPTURE section */}
        <View className="px-6 pt-6">
          <SectionTitle underlineWidth={42}>capture</SectionTitle>
          <View className="mt-3">

            <SettingRow
              icon={<BellIcon size={17} color={colors.ink3} strokeWidth={1.4} />}
              label="haptic on save"
              right={<CustomSwitch value={settings.hapticOnSave} onValueChange={(v) => setSetting('hapticOnSave', v)} />}
            />
          </View>
        </View>

        <View className="items-center pt-9 pb-6">
          <ThemeText variant="meta" color="ink4">
            <ThemeText variant="subheading" color="ink3">kaori</ThemeText>
            {' · v1.0.0'}
          </ThemeText>
        </View>
      </ScrollView>

    </View>
  );
}
