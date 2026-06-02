import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Animated,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme, FONT } from '@/theme';
import { ThemeText } from '@/components/ui/primitives/ThemeText';
import { GrainOverlay } from '@/components/ui/primitives/GrainOverlay';
import { useAnimatedPopup } from '@/hooks';
import { SHADOW_POPUP, BUTTON_TEXT_ON_ACCENT } from '@/constants';

type Props = {
  visible: boolean;
  onClose: () => void;
  value: Date | null;
  onChange: (date: Date) => void;
  baseDate: Date;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10 … 55
const PERIODS = ['AM', 'PM'] as const;

const DEFAULT_HOUR = 1; // 1:00 AM — opens the hour wheel on 01 (top) when no time is set
const DEFAULT_MINUTE = 0;

const ITEM_HEIGHT = 44;

// The date the wheels initialize from: the existing reminder if set, otherwise
// the base date's day at the default time (so the wheel doesn't open on midnight/12).
function initialDateFrom(value: Date | null, baseDate: Date): Date {
  if (value) return value;
  const d = new Date(baseDate);
  d.setHours(DEFAULT_HOUR, DEFAULT_MINUTE, 0, 0);
  return d;
}

type WheelProps = {
  items: string[];
  selectedIndex: number;
  onIndexChange: (i: number) => void;
};

function Wheel({ items, selectedIndex, onIndexChange }: WheelProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const momentumActive = useRef(false);
  const [activeIdx, setActiveIdx] = useState(selectedIndex);

  // Set initial scroll position once on mount — never synced again from props
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onScrollDone(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.max(
      0,
      Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)),
    );
    setActiveIdx(idx);
    onIndexChange(idx);
  }

  return (
    <View className="overflow-hidden flex-1" style={{ height: ITEM_HEIGHT * 3 }}>
      {/* selection highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: `${colors.amber}55`,
          backgroundColor: `${colors.amber}12`,
          zIndex: 1,
        }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
        onMomentumScrollBegin={() => {
          momentumActive.current = true;
        }}
        onMomentumScrollEnd={onScrollDone}
        onScrollEndDrag={(e) => {
          if (!momentumActive.current) onScrollDone(e);
          momentumActive.current = false;
        }}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.7}
            onPress={() => {
              setActiveIdx(i);
              scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
              onIndexChange(i);
            }}
            className="items-center justify-center"
            style={{ height: ITEM_HEIGHT }}
          >
            <ThemeText
              variant="chip"
              size={18}
              style={{
                fontFamily: FONT.geistMedium,
                color: i === activeIdx ? colors.amber : colors.ink3,
              }}
            >
              {item}
            </ThemeText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export function ReminderPicker({ visible, onClose, value, onChange, baseDate }: Props) {
  const { colors } = useTheme();
  const { opacity, open, close } = useAnimatedPopup();

  const initial = initialDateFrom(value, baseDate);
  const initHours = initial.getHours();
  const [hourIdx, setHourIdx] = useState(() => {
    const h = initHours % 12;
    return HOURS.indexOf(h === 0 ? 12 : h);
  });
  const [minuteIdx, setMinuteIdx] = useState(() =>
    Math.min(MINUTES.length - 1, Math.round(initial.getMinutes() / 5)),
  );
  const [periodIdx, setPeriodIdx] = useState(() => (initHours >= 12 ? 1 : 0));

  // Initialize the wheels once per open (rising edge of `visible`). Re-running on
  // every render would reset the wheels mid-edit and restart the fade-in (blink).
  const wasVisible = useRef(false);
  useEffect(() => {
    if (visible && !wasVisible.current) {
      const d = initialDateFrom(value, baseDate);
      const h = d.getHours();
      const hMod = h % 12;
      setHourIdx(HOURS.indexOf(hMod === 0 ? 12 : hMod));
      setMinuteIdx(Math.min(MINUTES.length - 1, Math.round(d.getMinutes() / 5)));
      setPeriodIdx(h >= 12 ? 1 : 0);
      open();
    }
    wasVisible.current = visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleDismiss = useCallback(() => {
    close(() => onClose());
  }, [close, onClose]);

  function handleConfirm() {
    const hour = HOURS[hourIdx];
    const minute = MINUTES[minuteIdx];
    const isPM = PERIODS[periodIdx] === 'PM';
    const result = new Date(baseDate);
    result.setHours(isPM ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour, minute, 0, 0);
    onChange(result);
    close(() => onClose());
  }

  const hourLabels = HOURS.map((h) => String(h).padStart(2, '0'));
  const minuteLabels = MINUTES.map((m) => String(m).padStart(2, '0'));
  const periodLabels = [...PERIODS];

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View
          className="flex-1 items-center justify-center p-6"
          style={{ backgroundColor: `${colors.bg}cc` }}
        >
          <View onStartShouldSetResponder={() => true} className="w-full">
            <Animated.View
              className="w-full bg-theme-paper rounded-2xl border border-theme-line2 p-4 overflow-hidden"
              style={{ opacity, ...SHADOW_POPUP }}
            >
              <GrainOverlay />

              {/* Time picker header */}
              <View className="items-center mb-4">
                <ThemeText variant="chip" size={16} color="cream">
                  pick a time
                </ThemeText>
              </View>

              {/* Scroll wheels */}
              <View className="flex-row items-center gap-2 mb-5">
                <Wheel items={hourLabels} selectedIndex={hourIdx} onIndexChange={setHourIdx} />
                <ThemeText variant="chip" size={20} color="ink3">
                  :
                </ThemeText>
                <Wheel
                  items={minuteLabels}
                  selectedIndex={minuteIdx}
                  onIndexChange={setMinuteIdx}
                />
                <Wheel
                  items={periodLabels}
                  selectedIndex={periodIdx}
                  onIndexChange={setPeriodIdx}
                />
              </View>

              {/* Confirm button */}
              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.85}
                className="h-[48px] rounded-2xl bg-theme-amber items-center justify-center"
              >
                <ThemeText variant="button" style={{ color: BUTTON_TEXT_ON_ACCENT }}>
                  set reminder
                </ThemeText>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
