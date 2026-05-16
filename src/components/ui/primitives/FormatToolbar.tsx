import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { CircleIcon, StrikethroughIcon } from '@/assets/icons';

type Props = {
  onCheckbox: () => void;
  onStrikethrough: () => void;
};

export function FormatToolbar({ onCheckbox, onStrikethrough }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 46,
        paddingHorizontal: 8,
        backgroundColor: colors.bg,
        borderTopWidth: 1,
        borderTopColor: colors.line,
      }}
    >
      <TouchableOpacity
        onPress={onCheckbox}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        activeOpacity={0.6}
      >
        <CircleIcon size={22} color={colors.amber} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onStrikethrough}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        activeOpacity={0.6}
      >
        <StrikethroughIcon size={16} color={colors.amber} />
      </TouchableOpacity>
    </View>
  );
}
