import React, { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { ThemeText } from '@/components/ui';
import { useTheme } from '@/theme';
import { PAN_SPEED_MAX, PAN_SPEED_MIN } from '@/hooks/useCanvasPanSpeed';

// A slider built from a Pan gesture rather than pulling in @react-native-community/slider:
// that package is a native module, and this is one control on one screen. Fifty lines here
// costs less than a dependency that has to be kept in step with the SDK.
export function PanSpeedSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const fraction = (value - PAN_SPEED_MIN) / (PAN_SPEED_MAX - PAN_SPEED_MIN);

  function setFromX(x: number) {
    if (width <= 0) return;
    const f = Math.min(1, Math.max(0, x / width));
    onChange(PAN_SPEED_MIN + f * (PAN_SPEED_MAX - PAN_SPEED_MIN));
  }

  // minDistance(0) so a tap anywhere on the track jumps to that value, rather than requiring
  // a drag from the thumb.
  const drag = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      'worklet';
      runOnJS(setFromX)(e.x);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(setFromX)(e.x);
    });

  return (
    <View className="px-4 py-3">
      <View className="mb-2 flex-row items-center justify-between">
        <ThemeText variant="meta">pan speed</ThemeText>
        <ThemeText variant="meta" color={colors.amber}>
          {value.toFixed(1)}×
        </ThemeText>
      </View>

      <GestureDetector gesture={drag}>
        {/* The touch target is the full row height; the visible track is thinner and centred
            inside it, so the control is easy to hit without looking heavy. */}
        <View
          className="justify-center"
          style={{ height: 28 }}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          <View className="rounded-full" style={{ height: 4, backgroundColor: colors.line2 }}>
            <View
              className="rounded-full"
              style={{ height: 4, width: `${fraction * 100}%`, backgroundColor: colors.amber }}
            />
          </View>
          <View
            className="absolute rounded-full border"
            style={{
              width: 18,
              height: 18,
              borderColor: colors.amber,
              backgroundColor: colors.paper,
              // Centred on the filled portion, and pulled back by half the thumb so it doesn't
              // overhang either end of the track.
              left: Math.max(0, fraction * width - 9),
            }}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
