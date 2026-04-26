import React from 'react';
import { View } from 'react-native';

// Simulates the CSS repeating-linear-gradient paper grain from the design.
// Renders thin horizontal lines at ~27px intervals over the card.
export function GrainOverlay() {
  const lines = Array.from({ length: 20 });
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        borderRadius: 16,
      }}
    >
      {lines.map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: i * 27 + 26,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: 'rgba(232,216,184,0.022)',
          }}
        />
      ))}
    </View>
  );
}
