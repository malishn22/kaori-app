import React from 'react';
import { View, type ViewStyle } from 'react-native';
type DividerProps = {
  marginHorizontal?: number;
  style?: ViewStyle;
};

export function Divider({ marginHorizontal = 0, style }: DividerProps) {
  return <View className="h-px bg-theme-line2" style={[{ marginHorizontal }, style]} />;
}
