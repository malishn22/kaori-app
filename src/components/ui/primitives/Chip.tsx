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

  const chipClass = "flex-row items-center gap-1.5 px-3 rounded-full border";
  const dynamicStyle = { paddingVertical, backgroundColor: bg, borderColor: border };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} className={chipClass} style={dynamicStyle}>
        {dot && color && <ColorDot color={color} size={dotSize} />}
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={chipClass} style={dynamicStyle}>
      {dot && color && <ColorDot color={color} size={dotSize} />}
      {children}
    </View>
  );
}
