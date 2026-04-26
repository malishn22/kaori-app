import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { resolveColor } from '@/theme/colors';

type HeaderTextProps = {
  size?: number;
  lineHeight?: number;
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
};

export function HeaderText({ size = 36, lineHeight = 40, color, style, children }: HeaderTextProps) {
  const { colors } = useTheme();
  const resolvedColor = resolveColor(color, colors) ?? colors.cream;

  return (
    <Text style={[{ fontFamily: FONT.kalam, fontSize: size, lineHeight, color: resolvedColor }, style]}>
      {children}
    </Text>
  );
}
