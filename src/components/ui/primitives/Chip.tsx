import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { ColorDot } from './ColorDot';

type ChipProps = {
  color?: string;
  active?: boolean;
  dot?: boolean;
  dotSize?: number;
  onPress?: () => void;
  paddingVertical?: number;
  children: React.ReactNode;
};

export function Chip({ color, active = false, dot = false, dotSize = 6, onPress, paddingVertical = 6, children }: ChipProps) {
  const { colors } = useTheme();
  const bg     = color ? (active ? `${color}1f` : 'transparent') : (active ? `${colors.ink4}1f` : 'transparent');
  const border = color ? (active ? `${color}55` : colors.line2)  : (active ? colors.ink3 : colors.line2);

  const style = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical,
    borderRadius: 999,
    backgroundColor: bg,
    borderWidth: 1,
    borderColor: border,
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={style}>
        {dot && color && <ColorDot color={color} size={dotSize} />}
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={style}>
      {dot && color && <ColorDot color={color} size={dotSize} />}
      {children}
    </View>
  );
}
