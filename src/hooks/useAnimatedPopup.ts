import { useRef } from 'react';
import { Animated } from 'react-native';

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
      duration: 160,
      useNativeDriver: true,
    }).start();
  }

  function close(cb?: () => void) {
    Animated.timing(anim, {
      toValue: 0,
      duration: 130,
      useNativeDriver: true,
    }).start(cb);
  }

  return { anim, opacity, open, close };
}
