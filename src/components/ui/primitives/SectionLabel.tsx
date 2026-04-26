import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { useTheme, FONT } from '@/theme';

type SectionLabelProps = {
  size?: number;
  lineHeight?: number;
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
};

export function SectionLabel({ size = 22, lineHeight, color, style, children }: SectionLabelProps) {
  const { colors } = useTheme();
  const resolvedColor = color
    ? (color in colors ? (colors as Record<string, string>)[color] : color)
    : colors.cream;

  return (
    <Text style={[{ fontFamily: FONT.kalam, fontSize: size, color: resolvedColor, ...(lineHeight ? { lineHeight } : {}) }, style]}>
      {children}
    </Text>
  );
}
