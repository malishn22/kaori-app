import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const grainSource = require('@/assets/textures/grain.png');

export function GrainOverlay() {
  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Image source={grainSource} resizeMode="repeat" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.04,
  },
});
