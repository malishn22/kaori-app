import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { ThemeText } from './ThemeText';

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
        height: 44,
        paddingHorizontal: 8,
        backgroundColor: colors.bg,
        borderTopWidth: 1,
        borderTopColor: colors.line,
      }}
    >
      <TouchableOpacity
        onPress={onCheckbox}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={0.6}
      >
        <View
          style={{
            width: 19,
            height: 19,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: colors.amber,
          }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onStrikethrough}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={0.6}
      >
        <ThemeText
          variant="meta"
          size={17}
          color="amber"
          style={{ fontFamily: FONT.kalam, textDecorationLine: 'line-through' }}
        >
          S
        </ThemeText>
      </TouchableOpacity>
    </View>
  );
}
