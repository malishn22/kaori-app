import React from 'react';
import { View } from 'react-native';

type ColorDotProps = { color: string; size?: number };

export function ColorDot({ color, size = 7 }: ColorDotProps) {
  return <View style={{ width: size, height: size, borderRadius: 999, backgroundColor: color }} />;
}
