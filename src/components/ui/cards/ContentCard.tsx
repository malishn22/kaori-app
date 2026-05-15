import React from 'react';
import { View, TouchableOpacity, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import type { Note, Task, Folder } from '@/types';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { FormattedText } from '../primitives/FormattedText';
import { ColorDot } from '../primitives/ColorDot';
import { RestoreChip } from '../primitives/RestoreChip';
import { BookmarkIcon, CheckIcon } from '@/assets/icons';
import { SHADOW_CARD, CARD_TILTS, DELETE_COLOR, ARCHIVED_OPACITY } from '@/constants';
import { formatDueDate, isOverdue, isDueSoon } from '@/utils';

/** Matches TaskCard title treatment for done / archived-note rows. */
function hiddenPrimaryExtras(hiddenLine: boolean, ink4: string): { style?: TextStyle; linkStyle?: TextStyle } {
  if (!hiddenLine) return {};
  return {
    style: { textDecorationLine: 'line-through', opacity: 0.5 },
    linkStyle: { color: ink4, textDecorationColor: ink4 },
  };
}

export type ContentCardNoteProps = {
  kind: 'note';
  note: Note;
  folder?: Folder;
  index?: number;
  onPress: () => void;
  onRestore?: () => void;
};

export type ContentCardTaskProps = {
  kind: 'task';
  task: Task;
  folder?: Folder;
  index?: number;
  onPress: () => void;
  onToggle: () => void;
  onRestore?: () => void;
};

export type ContentCardProps = ContentCardNoteProps | ContentCardTaskProps;

export function ContentCard(props: ContentCardProps) {
  const { colors } = useTheme();
  const index = props.index ?? 0;
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
  const { folder } = props;

  if (props.kind === 'note') {
    const { note, onPress, onRestore } = props;
    const isArchived = !!note.archived;
    const primaryExtras = hiddenPrimaryExtras(!!onRestore, colors.ink4);

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View
          className="overflow-hidden rounded-card border border-theme-line bg-theme-paper p-4 pb-3.5"
          style={{
            transform: [{ rotate: `${tilt}deg` }],
            ...SHADOW_CARD,
            opacity: isArchived ? ARCHIVED_OPACITY : 1,
          }}
        >
          <GrainOverlay />
          <View className="flex-row items-center gap-2">
            <View className="min-w-0 flex-1">
              <FormattedText
                text={note.text}
                links={note.links}
                numberOfLines={3}
                size={15}
                lineHeight={22}
                letterSpacing={-0.05}
                {...primaryExtras}
              />
            </View>
            {(note.pinned || onRestore) ? (
              <View className="shrink-0 flex-row items-center gap-1.5">
                {note.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
                {onRestore ? <RestoreChip onRestore={onRestore} /> : null}
              </View>
            ) : null}
          </View>
          {folder ? (
            <View className="mt-2.5 flex-row items-center gap-1.5">
              <ColorDot color={folder.color} size={7} />
              <ThemeText variant="chip" size={11.5} color="ink3" letterSpacing={0.3}>
                {folder.name}
              </ThemeText>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  const { task, onPress, onToggle, onRestore } = props;
  const isArchived = !!task.archived;
  const primaryExtras = hiddenPrimaryExtras(!!task.done, colors.ink4);

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
        className="overflow-hidden rounded-card border border-theme-line bg-theme-paper p-4 pb-3.5"
        style={{
          transform: [{ rotate: `${tilt}deg` }],
          ...SHADOW_CARD,
          opacity: isArchived ? ARCHIVED_OPACITY : 1,
        }}
      >
        <GrainOverlay />
        <View className="flex-row items-center gap-2">
          <View className="min-w-0 flex-1">
            <FormattedText
              text={task.title}
              links={task.links ?? {}}
              numberOfLines={3}
              size={15}
              lineHeight={22}
              letterSpacing={-0.05}
              {...primaryExtras}
            />
          </View>
          <View className="shrink-0 flex-row items-center gap-1.5">
            {!isArchived && task.dueDate ? (
              <ThemeText variant="chip" size={11} color={dueDateColor}>
                {formatDueDate(task.dueDate)}
              </ThemeText>
            ) : null}
            {task.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
            {onRestore ? <RestoreChip onRestore={onRestore} /> : null}
            {!isArchived && (
              <TouchableOpacity
                onPress={onToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="size-5 items-center justify-center rounded-full border-[1.5px]"
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
        {folder ? (
          <View className="mt-2.5 flex-row items-center gap-1.5">
            <ColorDot color={folder.color} size={7} />
            <ThemeText variant="chip" size={11.5} color="ink3" letterSpacing={0.3}>
              {folder.name}
            </ThemeText>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
