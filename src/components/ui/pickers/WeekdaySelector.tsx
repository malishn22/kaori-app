import React from 'react';
import { View } from 'react-native';
import { Chip } from '../primitives/Chip';
import { ThemeText } from '../primitives/ThemeText';
import { DAY_LABELS, WEEK_ORDER } from '@/utils/time';

type Props = {
  selected: number[];
  onToggle: (day: number) => void;
  onSetAll: (days: number[]) => void;
  label?: string;
};

export function WeekdaySelector({ selected, onToggle, onSetAll, label }: Props) {
  const isDaily = selected.length === 7;

  return (
    <View className={label ? 'mt-6' : ''}>
      {label && (
        <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
          {label}
        </ThemeText>
      )}
      <View className="flex-row gap-1.5">
        <Chip active={isDaily} onPress={() => onSetAll(isDaily ? [] : WEEK_ORDER)}>
          <ThemeText variant="chip" size={13} color={isDaily ? 'ink' : 'ink2'}>
            daily
          </ThemeText>
        </Chip>
        {WEEK_ORDER.map((day) => {
          const active = selected.includes(day);
          return (
            <Chip key={day} active={active} onPress={() => onToggle(day)}>
              <ThemeText variant="chip" size={13} color={active ? 'ink' : 'ink2'}>
                {DAY_LABELS[day]}
              </ThemeText>
            </Chip>
          );
        })}
      </View>
    </View>
  );
}
