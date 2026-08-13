import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/theme';
import { ThemeText } from '../primitives/ThemeText';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { FolderAvatar } from './FolderAvatar';
import { RestoreChip } from '../primitives/RestoreChip';
import { ChevronIcon, BookmarkIcon } from '@/assets/icons';
import { SHADOW_CARD, ARCHIVED_OPACITY } from '@/constants';
import type { Folder } from '@/types';

type FolderCardProps = {
  folder: Folder;
  index: number;
  noteCount: number;
  taskCount: number;
  onRestore?: () => void;
  isDragging?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function FolderCard({
  folder,
  index: _index,
  noteCount,
  taskCount,
  onRestore,
  isDragging,
  onPress,
  onLongPress,
}: FolderCardProps) {
  const { colors } = useTheme();
  const shadowStyle = isDragging
    ? { ...SHADOW_CARD, shadowOpacity: 0.4, elevation: 12 }
    : SHADOW_CARD;
  const isArchived = !!folder.archived;
  const counts = [
    noteCount > 0 && `${noteCount} notes`,
    taskCount > 0 && `${taskCount} tasks`,
  ].filter(Boolean);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      disabled={isDragging}
    >
      <View
        className="bg-theme-paper rounded-card p-4 border border-theme-line flex-row items-center gap-3.5 overflow-hidden"
        style={{
          ...shadowStyle,
          opacity: isArchived ? ARCHIVED_OPACITY : 1,
        }}
      >
        <GrainOverlay />
        <FolderAvatar name={folder.name} color={folder.color} />
        <View className="flex-1 min-w-0">
          <ThemeText variant="title">{folder.name}</ThemeText>
          {counts.length > 0 && (
            <ThemeText variant="chip" color="ink3" style={{ marginTop: 4 }}>
              {counts.join(' · ')}
            </ThemeText>
          )}
        </View>
        {folder.pinned && <BookmarkIcon size={13} color={colors.amber} fill={colors.amber} />}
        {onRestore && <RestoreChip onRestore={onRestore} />}
        {!isArchived && <ChevronIcon size={14} color={colors.ink4} />}
      </View>
    </TouchableOpacity>
  );
}
