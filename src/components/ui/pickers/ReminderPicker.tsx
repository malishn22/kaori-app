import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, TouchableOpacity, Modal, Pressable, Animated,
  ScrollView, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useTheme, FONT } from '@/theme';
import { ThemeText } from '@/components/ui/primitives/ThemeText';
import { GrainOverlay } from '@/components/ui/primitives/GrainOverlay';
import { ChevronIcon } from '@/assets/icons';
import { isSameDay } from '@/utils';
import { useAnimatedPopup } from '@/hooks';
import { SHADOW_POPUP, BUTTON_TEXT_ON_ACCENT } from '@/constants';

type Props = {
  visible: boolean;
  onClose: () => void;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
};

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10 … 55
const PERIODS = ['AM', 'PM'] as const;

const ITEM_HEIGHT = 44;

type Cell = {
  key: string;
  day: number | null;
  date: Date | null;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
};

function buildGrid(year: number, month: number, value: Date | null, minimumDate?: Date): Cell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDay = minimumDate
    ? new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate())
    : null;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Cell[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ key: `e-${i}`, day: null, date: null, isToday: false, isSelected: false, isDisabled: true });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isDisabled = minDay ? date.getTime() < minDay.getTime() : false;
    cells.push({
      key: `d-${d}`,
      day: d,
      date,
      isToday: isSameDay(date, today),
      isSelected: value !== null && isSameDay(date, value),
      isDisabled,
    });
  }

  while (cells.length < 42) {
    cells.push({ key: `t-${cells.length}`, day: null, date: null, isToday: false, isSelected: false, isDisabled: true });
  }

  return cells;
}

function snapIndex(offset: number): number {
  return Math.max(0, Math.round(offset / ITEM_HEIGHT));
}

type WheelProps = {
  items: string[];
  selectedIndex: number;
  onIndexChange: (i: number) => void;
};

function Wheel({ items, selectedIndex, onIndexChange }: WheelProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    if (!isUserScrolling.current) {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }
  }, [selectedIndex]);

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    isUserScrolling.current = false;
    const idx = snapIndex(e.nativeEvent.contentOffset.y);
    if (idx !== selectedIndex) onIndexChange(idx);
    scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
  }

  return (
    <View style={{ height: ITEM_HEIGHT * 3, overflow: 'hidden', flex: 1 }}>
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
        onScrollBeginDrag={() => { isUserScrolling.current = true; }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.7}
            onPress={() => {
              onIndexChange(i);
              scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
            }}
            style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
          >
            <ThemeText
              variant="chip"
              size={18}
              style={{
                fontFamily: FONT.geistMedium,
                color: i === selectedIndex ? colors.amber : colors.ink3,
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

export function ReminderPicker({ visible, onClose, value, onChange, minimumDate }: Props) {
  const { colors } = useTheme();
  const { anim, opacity, open, close } = useAnimatedPopup();

  // Calendar state
  const [phase, setPhase] = useState<'date' | 'time'>('date');
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const d = value ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Time state
  const initial = value ?? new Date();
  const initHours = initial.getHours();
  const [hourIdx, setHourIdx] = useState(() => {
    const h = initHours % 12;
    return HOURS.indexOf(h === 0 ? 12 : h);
  });
  const [minuteIdx, setMinuteIdx] = useState(() => {
    const nearestFive = Math.round(initial.getMinutes() / 5) % 12;
    return nearestFive;
  });
  const [periodIdx, setPeriodIdx] = useState(() => (initHours >= 12 ? 1 : 0));

  useEffect(() => {
    if (visible) {
      setPhase('date');
      const d = value ?? new Date();
      setPickedDate(value);
      setDisplayMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      const h = d.getHours();
      const hMod = h % 12;
      setHourIdx(HOURS.indexOf(hMod === 0 ? 12 : hMod));
      const nearestFive = Math.round(d.getMinutes() / 5) % 12;
      setMinuteIdx(nearestFive);
      setPeriodIdx(h >= 12 ? 1 : 0);
      open();
    }
  }, [visible]);

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();

  const cells = useMemo(() => buildGrid(year, month, pickedDate, minimumDate), [year, month, pickedDate, minimumDate]);

  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  while (rows.length > 0 && rows[rows.length - 1].every(c => c.day === null)) rows.pop();

  const handleDismiss = useCallback(() => { close(() => onClose()); }, [close, onClose]);

  function handleDateSelect(date: Date) {
    setPickedDate(date);
    setPhase('time');
  }

  function handleConfirm() {
    if (!pickedDate) return;
    const hour = HOURS[hourIdx];
    const minute = MINUTES[minuteIdx];
    const isPM = PERIODS[periodIdx] === 'PM';
    const result = new Date(pickedDate);
    result.setHours(isPM ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour, minute, 0, 0);
    onChange(result);
    close(() => onClose());
  }

  const hourLabels = HOURS.map(h => String(h).padStart(2, '0'));
  const minuteLabels = MINUTES.map(m => String(m).padStart(2, '0'));
  const periodLabels = [...PERIODS];

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Pressable
        onPress={handleDismiss}
        className="flex-1 items-center justify-center p-6"
        style={{ backgroundColor: `${colors.bg}cc` }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} className="w-full">
          <Animated.View
            className="w-full bg-theme-paper rounded-2xl border border-theme-line2 p-4 overflow-hidden"
            style={{ opacity, transform: [{ scale: anim }], ...SHADOW_POPUP }}
          >
            <GrainOverlay />

            {phase === 'date' ? (
              <>
                {/* Calendar header */}
                <View className="flex-row items-center justify-between mb-4">
                  <TouchableOpacity
                    onPress={() => setDisplayMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    activeOpacity={0.7}
                    hitSlop={12}
                    className="size-9 items-center justify-center"
                  >
                    <ChevronIcon dir="left" size={16} color={colors.ink3} />
                  </TouchableOpacity>
                  <ThemeText variant="chip" size={16} color="cream">
                    {MONTH_NAMES[month]} {year}
                  </ThemeText>
                  <TouchableOpacity
                    onPress={() => setDisplayMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    activeOpacity={0.7}
                    hitSlop={12}
                    className="size-9 items-center justify-center"
                  >
                    <ChevronIcon dir="right" size={16} color={colors.ink3} />
                  </TouchableOpacity>
                </View>

                {/* Weekday labels */}
                <View className="flex-row mb-2">
                  {WEEKDAYS.map(day => (
                    <View key={day} className="flex-1 items-center">
                      <ThemeText variant="meta" size={10} color="ink4" uppercase>{day}</ThemeText>
                    </View>
                  ))}
                </View>

                {/* Day grid */}
                {rows.map((row, ri) => (
                  <View key={ri} className="flex-row mb-1">
                    {row.map(cell => {
                      if (cell.day === null) {
                        return <View key={cell.key} className="flex-1" style={{ aspectRatio: 1 }} />;
                      }
                      const bg = cell.isSelected
                        ? `${colors.amber}33`
                        : cell.isToday ? `${colors.ink4}1a` : 'transparent';
                      const border = cell.isSelected ? `${colors.amber}55` : 'transparent';
                      const textColor = cell.isDisabled ? colors.ink4
                        : cell.isSelected ? colors.amber : colors.ink;

                      return (
                        <TouchableOpacity
                          key={cell.key}
                          disabled={cell.isDisabled}
                          onPress={() => cell.date && handleDateSelect(cell.date)}
                          activeOpacity={0.7}
                          className="flex-1 items-center justify-center"
                          style={{ aspectRatio: 1 }}
                        >
                          <View
                            className="size-9 rounded-full items-center justify-center"
                            style={{ backgroundColor: bg, borderWidth: cell.isSelected ? 1 : 0, borderColor: border }}
                          >
                            <ThemeText variant="chip" size={14} style={{ color: textColor, fontFamily: FONT.kalam }}>
                              {cell.day}
                            </ThemeText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </>
            ) : (
              <>
                {/* Time picker header */}
                <View className="flex-row items-center justify-between mb-4">
                  <TouchableOpacity
                    onPress={() => setPhase('date')}
                    activeOpacity={0.7}
                    hitSlop={12}
                    className="size-9 items-center justify-center"
                  >
                    <ChevronIcon dir="left" size={16} color={colors.ink3} />
                  </TouchableOpacity>
                  <ThemeText variant="chip" size={16} color="cream">
                    pick a time
                  </ThemeText>
                  <View className="size-9" />
                </View>

                {/* Scroll wheels */}
                <View className="flex-row items-center gap-2 mb-5">
                  <Wheel items={hourLabels} selectedIndex={hourIdx} onIndexChange={setHourIdx} />
                  <ThemeText variant="chip" size={20} color="ink3">:</ThemeText>
                  <Wheel items={minuteLabels} selectedIndex={minuteIdx} onIndexChange={setMinuteIdx} />
                  <Wheel items={periodLabels} selectedIndex={periodIdx} onIndexChange={setPeriodIdx} />
                </View>

                {/* Confirm button */}
                <TouchableOpacity
                  onPress={handleConfirm}
                  activeOpacity={0.85}
                  className="h-[48px] rounded-2xl bg-theme-amber items-center justify-center"
                >
                  <ThemeText variant="button" style={{ color: BUTTON_TEXT_ON_ACCENT }}>set reminder</ThemeText>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
