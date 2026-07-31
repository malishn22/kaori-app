import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import type { Routine, Folder } from '@/types';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { FormattedText } from '../primitives/FormattedText';
import { ColorDot } from '../primitives/ColorDot';
import { RestoreChip } from '../primitives/RestoreChip';
import { BookmarkIcon, CheckIcon } from '@/assets/icons';
import { SHADOW_CARD, CARD_TILTS, ARCHIVED_OPACITY } from '@/constants';
import { DAY_LABELS, formatTimeOfDay, dateKey } from '@/utils/time';

type Props = {
  routine: Routine;
  folder?: Folder;
  index?: number;
  onPress: () => void;
  onToggleDone: () => void;
  onRestore?: () => void;
};

export function RoutineCard({
  routine,
  folder,
  index = 0,
  onPress,
  onToggleDone,
  onRestore,
}: Props) {
  const { colors } = useTheme();
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
  const isArchived = !!routine.archived;
  const isPaused = !routine.active;
  const doneToday = !!routine.completions[dateKey()];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View
        className="overflow-hidden rounded-card border border-theme-line bg-theme-paper p-4 pb-3.5"
        style={{
          transform: [{ rotate: `${tilt}deg` }],
          ...SHADOW_CARD,
          opacity: isArchived || isPaused ? ARCHIVED_OPACITY : 1,
        }}
      >
        <GrainOverlay />
        <View className="flex-row items-center gap-2">
          <View className="min-w-0 flex-1">
            <FormattedText
              text={routine.title}
              links={routine.links ?? {}}
              numberOfLines={3}
              size={15}
              lineHeight={22}
              letterSpacing={-0.05}
            />
          </View>
          <View className="shrink-0 flex-row items-center gap-1.5">
            <ThemeText variant="chip" size={11} color="ink4">
              {formatTimeOfDay(routine.reminderTime)}
            </ThemeText>
            {routine.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
            {onRestore ? (
              <RestoreChip onRestore={onRestore} />
            ) : (
              <TouchableOpacity
                onPress={onToggleDone}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="size-5 items-center justify-center rounded-full border-[1.5px]"
                style={{
                  borderColor: doneToday ? colors.amber : colors.line2,
                  backgroundColor: doneToday ? colors.amber : 'transparent',
                }}
              >
                {doneToday && <CheckIcon size={11} color={colors.paper} strokeWidth={2.5} />}
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View className="mt-2.5 flex-row items-center gap-3">
          <View className="flex-row gap-1">
            {DAY_LABELS.map((label, day) => {
              const active = routine.daysOfWeek.includes(day);
              return (
                <View
                  key={day}
                  className="size-4 items-center justify-center rounded-full"
                  style={{ backgroundColor: active ? `${colors.amber}22` : 'transparent' }}
                >
                  <ThemeText
                    variant="chip"
                    size={9}
                    color={active ? 'amber' : 'ink4'}
                    style={{ lineHeight: 11 }}
                  >
                    {label}
                  </ThemeText>
                </View>
              );
            })}
          </View>
          {folder ? (
            <View className="flex-row items-center gap-1.5">
              <ColorDot color={folder.color} size={7} />
              <ThemeText variant="chip" size={11.5} color="ink3" letterSpacing={0.3}>
                {folder.name}
              </ThemeText>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
