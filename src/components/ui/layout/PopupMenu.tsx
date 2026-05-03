import React, { useState } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '@/theme';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { POPUP_WIDTH, SHADOW_POPUP } from '@/constants';

type Props = {
  visible: boolean;
  onClose: () => void;
  anim: Animated.Value;
  opacity: Animated.AnimatedInterpolation<number>;
  anchor: 'top-right' | 'bottom-right';
  top?: number;
  bottom?: number;
  right?: number;
  children: React.ReactNode;
};

export function PopupMenu({ visible, onClose, anim, opacity, anchor, top, bottom, right = 16, children }: Props) {
  const { colors } = useTheme();
  const [height, setHeight] = useState(0);

  if (!visible) return null;

  const isTop = anchor === 'top-right';
  const translateYSign = isTop ? -1 : 1;

  return (
    <>
      <TouchableOpacity
        className="absolute inset-0"
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        onLayout={e => setHeight(e.nativeEvent.layout.height)}
        className="absolute overflow-hidden rounded-2xl border border-theme-line2 bg-theme-paper"
        style={{
          ...(top != null ? { top } : {}),
          ...(bottom != null ? { bottom } : {}),
          right,
          width: POPUP_WIDTH,
          ...SHADOW_POPUP,
          opacity,
          transform: [
            { translateX: POPUP_WIDTH / 2 },
            { translateY: translateYSign * height / 2 },
            { scale: anim },
            { translateY: -translateYSign * height / 2 },
            { translateX: -POPUP_WIDTH / 2 },
          ],
        }}
      >
        <GrainOverlay />
        {children}
      </Animated.View>
    </>
  );
}
