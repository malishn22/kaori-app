import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { resolveColor } from '@/theme/colors';

type SectionLabelProps = {
  size?: number;
  lineHeight?: number;
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
};

export function SectionLabel({ size = 22, lineHeight, color, style, children }: SectionLabelProps) {
  const { colors } = useTheme();
  const resolvedColor = resolveColor(color, colors) ?? colors.cream;

  return (
    <Text style={[{ fontFamily: FONT.kalam, fontSize: size, color: resolvedColor, ...(lineHeight ? { lineHeight } : {}) }, style]}>
      {children}
    </Text>
  );
}
