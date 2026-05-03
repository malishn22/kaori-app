import React from 'react';
import { Image, View } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const grainSource = require('@/assets/textures/grain.png');

export function GrainOverlay() {
  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      <Image source={grainSource} resizeMode="repeat" className="absolute top-0 left-0 w-full h-full opacity-[0.04]" />
    </View>
  );
}
