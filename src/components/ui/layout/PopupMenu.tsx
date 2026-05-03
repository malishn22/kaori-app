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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        onLayout={e => setHeight(e.nativeEvent.layout.height)}
        style={{
          position: 'absolute',
          ...(top != null ? { top } : {}),
          ...(bottom != null ? { bottom } : {}),
          right,
          width: POPUP_WIDTH,
          backgroundColor: colors.paper,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.line2,
          overflow: 'hidden',
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
