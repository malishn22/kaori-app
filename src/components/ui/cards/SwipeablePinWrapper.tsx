import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useHapticFeedback } from '@/hooks';
import { BookmarkIcon } from '@/assets/icons';
import { ThemeText } from '../primitives/ThemeText';

const TRIGGER_THRESHOLD = 20;
const DAMPING = 0.4;
const SNAP_DURATION = 150;
const WING_WIDTH = 36;

type Props = {
  children: React.ReactNode;
  isPinned: boolean;
  onTogglePin: () => void;
};

function PinWing({ isPinned, amberColor }: { isPinned: boolean; amberColor: string }) {
  return (
    <View style={{ width: WING_WIDTH, justifyContent: 'center', alignItems: 'center' }}>
      <BookmarkIcon size={16} color={amberColor} fill={isPinned ? 'transparent' : amberColor} />
      <ThemeText variant="chip" size={9} color={amberColor} style={{ marginTop: 2 }}>
        {isPinned ? 'unpin' : 'pin'}
      </ThemeText>
    </View>
  );
}

export function SwipeablePinWrapper({ children, isPinned, onTogglePin }: Props) {
  const { colors } = useTheme();
  const { impact } = useHapticFeedback();
  const translateX = useSharedValue(0);

  const fireAction = useCallback(() => {
    onTogglePin();
    impact();
  }, [onTogglePin, impact]);

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX * DAMPING;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > TRIGGER_THRESHOLD) {
        runOnJS(fireAction)();
      }
      translateX.value = withTiming(0, { duration: SNAP_DURATION });
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ overflow: 'hidden' }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flexDirection: 'row', marginLeft: -WING_WIDTH, marginRight: -WING_WIDTH }, rowStyle]}>
          <PinWing isPinned={isPinned} amberColor={colors.amber} />
          <View style={{ flex: 1 }}>
            {children}
          </View>
          <PinWing isPinned={isPinned} amberColor={colors.amber} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
