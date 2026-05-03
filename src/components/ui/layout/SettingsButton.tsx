import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { SettingsIcon } from '@/assets/icons';

export function SettingsButton() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={() => router.push('/settings')}
      hitSlop={12}
      activeOpacity={0.7}
      className="absolute right-6 z-[1]"
      style={{ top: insets.top + 40 }}
    >
      <SettingsIcon size={22} color={colors.ink2} strokeWidth={1.4} />
    </TouchableOpacity>
  );
}
