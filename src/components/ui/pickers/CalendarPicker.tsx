import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { ThemeText } from '@/components/ui/primitives/ThemeText';
import { GrainOverlay } from '@/components/ui/primitives/GrainOverlay';
import { ChevronIcon } from '@/assets/icons';
import { isSameDay } from '@/utils';
import { useAnimatedPopup } from '@/hooks';
import { SHADOW_POPUP } from '@/constants';

type CalendarPickerProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  visible: boolean;
  onClose: () => void;
};

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

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

  const minDay = minimumDate ? new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate()) : null;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Cell[] = [];

  // Leading empties
  for (let i = 0; i < firstDay; i++) {
    cells.push({ key: `e-${i}`, day: null, date: null, isToday: false, isSelected: false, isDisabled: true });
  }

  // Day cells
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

  // Trailing empties to fill 6 rows
  while (cells.length < 42) {
    cells.push({ key: `t-${cells.length}`, day: null, date: null, isToday: false, isSelected: false, isDisabled: true });
  }

  return cells;
}

export function CalendarPicker({ value, onChange, minimumDate, visible, onClose }: CalendarPickerProps) {
  const { colors } = useTheme();
  const { anim, opacity, open, close } = useAnimatedPopup();

  const [displayMonth, setDisplayMonth] = useState(() => {
    const d = value ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    if (visible) open();
  }, [visible]);

  useEffect(() => {
    if (value) {
      setDisplayMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    }
  }, [value]);

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();

  const cells = useMemo(() => buildGrid(year, month, value, minimumDate), [year, month, value, minimumDate]);

  // Split into rows of 7
  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  // Trim trailing rows that are entirely empty
  while (rows.length > 0 && rows[rows.length - 1].every(c => c.day === null)) {
    rows.pop();
  }

  function goToPrevMonth() {
    setDisplayMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setDisplayMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const handleDismiss = useCallback(() => {
    close(() => onClose());
  }, [close, onClose]);

  function handleSelect(date: Date) {
    onChange(date);
    close(() => onClose());
  }

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

            {/* Header: nav arrows + month/year */}
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={goToPrevMonth}
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
                onPress={goToNextMonth}
                activeOpacity={0.7}
                hitSlop={12}
                className="size-9 items-center justify-center"
              >
                <ChevronIcon dir="right" size={16} color={colors.ink3} />
              </TouchableOpacity>
            </View>

            {/* Weekday header */}
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
                    : cell.isToday
                      ? `${colors.ink4}1a`
                      : 'transparent';

                  const border = cell.isSelected ? `${colors.amber}55` : 'transparent';
                  const textColor = cell.isDisabled
                    ? colors.ink4
                    : cell.isSelected
                      ? colors.amber
                      : colors.ink;

                  return (
                    <TouchableOpacity
                      key={cell.key}
                      disabled={cell.isDisabled}
                      onPress={() => cell.date && handleSelect(cell.date)}
                      activeOpacity={0.7}
                      className="flex-1 items-center justify-center"
                      style={{ aspectRatio: 1 }}
                    >
                      <View
                        className="size-9 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: bg,
                          borderWidth: cell.isSelected ? 1 : 0,
                          borderColor: border,
                        }}
                      >
                        <ThemeText
                          variant="chip"
                          size={14}
                          style={{ color: textColor, fontFamily: FONT.kalam }}
                        >
                          {cell.day}
                        </ThemeText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
