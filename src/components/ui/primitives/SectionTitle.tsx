import React from 'react';
import { View, Text, type TextStyle } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { resolveColor } from '@/theme/colors';
import { Underline } from './Underline';

type SectionTitleProps = {
  children: string;
  underlineWidth?: number;
  showUnderline?: boolean;
  size?: number;
  lineHeight?: number;
  color?: string;
  style?: TextStyle;
};

export function SectionTitle({ children, underlineWidth = 52, showUnderline = true, size = 22, lineHeight, color, style }: SectionTitleProps) {
  const { colors } = useTheme();
  const resolvedColor = resolveColor(color, colors) ?? colors.cream;

  return (
    <View>
      <Text style={[{ fontFamily: FONT.kalam, fontSize: size, color: resolvedColor, ...(lineHeight ? { lineHeight } : {}) }, style]}>
        {children}
      </Text>
      {showUnderline && <Underline width={underlineWidth} />}
    </View>
  );
}
