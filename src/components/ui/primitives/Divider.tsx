import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type DividerProps = {
  marginHorizontal?: number;
  style?: ViewStyle;
};

export function Divider({ marginHorizontal = 0, style }: DividerProps) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.line2, marginHorizontal }, style]} />;
}
