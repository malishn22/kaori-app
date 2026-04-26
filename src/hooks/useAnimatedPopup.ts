import { useRef } from 'react';
import { Animated } from 'react-native';
import { ANIM_POPUP_OPEN, ANIM_POPUP_CLOSE } from '@/constants';

export function useAnimatedPopup() {
  const anim = useRef(new Animated.Value(0)).current;

  const opacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 1, 1],
  });

  function open() {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: ANIM_POPUP_OPEN,
      useNativeDriver: true,
    }).start();
  }

  function close(cb?: () => void) {
    Animated.timing(anim, {
      toValue: 0,
      duration: ANIM_POPUP_CLOSE,
      useNativeDriver: true,
    }).start(cb);
  }

  return { anim, opacity, open, close };
}
