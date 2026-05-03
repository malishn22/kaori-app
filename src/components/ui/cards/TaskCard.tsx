import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import type { Task, Folder } from '@/types';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { ColorDot } from '../primitives/ColorDot';
import { Chip } from '../primitives/Chip';
import { BookmarkIcon, CheckIcon } from '@/assets/icons';
import { SHADOW_CARD, DELETE_COLOR } from '@/constants';
import { formatDueDate, isOverdue, isDueSoon } from '@/utils';

const TILTS = [-0.4, 0.3, -0.2, 0.5, -0.3];

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
  const tilt = TILTS[index % TILTS.length];
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
        style={{
          backgroundColor: colors.paper,
          borderRadius: 16,
          padding: 16,
          paddingBottom: 14,
          borderWidth: 1,
          borderColor: colors.line,
          transform: [{ rotate: `${tilt}deg` }],
          ...SHADOW_CARD,
          overflow: 'hidden',
          opacity: isArchived ? 0.5 : 1,
        }}
      >
        <GrainOverlay />

        {/* Title row — title + indicators inline */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {!isArchived && task.dueDate && (
              <ThemeText variant="chip" size={11} color={dueDateColor}>
                {formatDueDate(task.dueDate)}
              </ThemeText>
            )}
            {task.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
            {onRestore && (
              <Chip color={colors.amber} active onPress={onRestore} paddingVertical={4}>
                <ThemeText variant="chip" size={12} color="amber">restore</ThemeText>
              </Chip>
            )}
            {!isArchived && (
              <TouchableOpacity
                onPress={onToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: task.done ? colors.amber : colors.line2,
                  backgroundColor: task.done ? colors.amber : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {task.done && <CheckIcon size={11} color={colors.paper} strokeWidth={2.5} />}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bottom row — folder */}
        {folder && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
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
