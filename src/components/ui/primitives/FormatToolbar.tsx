import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { CircleIcon, DotLineIcon, NumberedListIcon, StrikethroughIcon } from '@/assets/icons';

type Props = {
  onCheckbox: () => void;
  onDotted: () => void;
  onNumbered: () => void;
  onStrikethrough: () => void;
};

export function FormatToolbar({ onCheckbox, onDotted, onNumbered, onStrikethrough }: Props) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center h-[46px] px-2 border-t border-theme-line bg-theme-bg">
      <TouchableOpacity
        onPress={onCheckbox}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-10 items-center justify-center"
        activeOpacity={0.6}
      >
        <CircleIcon size={22} color={colors.amber} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDotted}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-10 items-center justify-center"
        activeOpacity={0.6}
      >
        <DotLineIcon size={20} color={colors.amber} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNumbered}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-10 items-center justify-center"
        activeOpacity={0.6}
      >
        <NumberedListIcon size={20} color={colors.amber} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onStrikethrough}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-10 items-center justify-center"
        activeOpacity={0.6}
      >
        <StrikethroughIcon size={16} color={colors.amber} />
      </TouchableOpacity>
    </View>
  );
}
