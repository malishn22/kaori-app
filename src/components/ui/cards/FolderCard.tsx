import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { ThemeText } from '../primitives/ThemeText';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { FolderAvatar } from './FolderAvatar';
import { RestoreChip } from '../primitives/RestoreChip';
import { ChevronIcon, BookmarkIcon } from '@/assets/icons';
import { SHADOW_CARD, CARD_TILTS, CARD_BORDER_RADIUS, ARCHIVED_OPACITY } from '@/constants';
import type { Folder } from '@/types';

type FolderCardProps = {
  folder: Folder;
  index: number;
  noteCount: number;
  taskCount: number;
  onRestore?: () => void;
};

export function FolderCard({ folder, index, noteCount, taskCount, onRestore }: FolderCardProps) {
  const { colors } = useTheme();
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
  const isArchived = !!folder.archived;

  return (
    <View style={{
      backgroundColor: colors.paper,
      borderRadius: CARD_BORDER_RADIUS,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
      transform: [{ rotate: `${tilt}deg` }],
      ...SHADOW_CARD,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      overflow: 'hidden',
      opacity: isArchived ? ARCHIVED_OPACITY : 1,
    }}>
      <GrainOverlay />
      <FolderAvatar name={folder.name} color={folder.color} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <ThemeText variant="title">{folder.name}</ThemeText>
        <ThemeText variant="chip" color="ink3" style={{ marginTop: 4 }}>
          {noteCount} notes · {taskCount} tasks
        </ThemeText>
      </View>
      {folder.pinned && <BookmarkIcon size={13} color={colors.amber} fill={colors.amber} />}
      {onRestore && <RestoreChip onRestore={onRestore} />}
      {!isArchived && <ChevronIcon size={14} color={colors.ink4} />}
    </View>
  );
}
