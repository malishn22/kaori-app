import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import type { Task, Folder } from '@/types';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { ColorDot } from '../primitives/ColorDot';
import { RestoreChip } from '../primitives/RestoreChip';
import { BookmarkIcon, CheckIcon } from '@/assets/icons';
import { SHADOW_CARD, DELETE_COLOR, CARD_TILTS, CARD_BORDER_RADIUS, ARCHIVED_OPACITY } from '@/constants';
import { formatDueDate, isOverdue, isDueSoon } from '@/utils';

type Props = {
  task: Task;
  folder?: Folder;
  index?: number;
  onToggle: () => void;
  onPress: () => void;
  onRestore?: () => void;
};

export function TaskCard({ task, folder, index = 0, onToggle, onPress, onRestore }: Props) {
  const { colors } = useTheme();
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
  const isArchived = !!task.archived;

  const dueDateColor = task.dueDate
    ? task.done
      ? colors.ink4
      : isOverdue(task.dueDate)
        ? DELETE_COLOR
        : isDueSoon(task.dueDate)
          ? colors.amber
          : colors.ink4
    : undefined;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View
        className="bg-theme-paper rounded-card p-4 pb-3.5 border border-theme-line overflow-hidden"
        style={{
          transform: [{ rotate: `${tilt}deg` }],
          ...SHADOW_CARD,
          opacity: isArchived ? ARCHIVED_OPACITY : 1,
        }}
      >
        <GrainOverlay />

        {/* Title row — title + indicators inline */}
        <View className="flex-row items-center gap-2">
          <ThemeText
            variant="body"
            numberOfLines={1}
            style={{
              flex: 1,
              flexShrink: 1,
              textDecorationLine: task.done ? 'line-through' : 'none',
              opacity: task.done ? 0.5 : 1,
            }}
          >
            {task.title}
          </ThemeText>

          <View className="flex-row items-center gap-1.5 shrink-0">
            {!isArchived && task.dueDate && (
              <ThemeText variant="chip" size={11} color={dueDateColor}>
                {formatDueDate(task.dueDate)}
              </ThemeText>
            )}
            {task.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
            {onRestore && <RestoreChip onRestore={onRestore} />}
            {!isArchived && (
              <TouchableOpacity
                onPress={onToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="size-5 rounded-full border-[1.5px] items-center justify-center"
                style={{
                  borderColor: task.done ? colors.amber : colors.line2,
                  backgroundColor: task.done ? colors.amber : 'transparent',
                }}
              >
                {task.done && <CheckIcon size={11} color={colors.paper} strokeWidth={2.5} />}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bottom row — folder */}
        {folder && (
          <View className="flex-row items-center gap-1.5 mt-2.5">
            <ColorDot color={folder.color} size={7} />
            <ThemeText variant="chip" size={11.5} color="ink3" letterSpacing={0.3}>
              {folder.name}
            </ThemeText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
