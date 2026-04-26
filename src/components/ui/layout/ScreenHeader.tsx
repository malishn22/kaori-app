import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { BackIcon } from '@/assets/icons';

type HeaderAction = { icon: React.ReactNode; onPress?: () => void };

type Props = {
  onBack: () => void;
  rightActions?: HeaderAction[];
};

export function ScreenHeader({ onBack, rightActions = [] }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: colors.bg, paddingTop: insets.top + 16 }}>
      <View style={{
        height: 52,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}>
        <TouchableOpacity onPress={onBack} hitSlop={12} activeOpacity={0.7}>
          <BackIcon size={20} color={colors.ink2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {rightActions.map((action, i) => (
          <TouchableOpacity key={i} onPress={action.onPress} hitSlop={12} activeOpacity={0.7} style={{ marginLeft: i > 0 ? 16 : 0 }}>
            {action.icon}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
