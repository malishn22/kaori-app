import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import type { Note, Folder } from '@/types';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { LinkedText } from '../primitives/LinkedText';
import { ColorDot } from '../primitives/ColorDot';
import { RestoreChip } from '../primitives/RestoreChip';
import { BookmarkIcon } from '@/assets/icons';
import { SHADOW_CARD, CARD_TILTS, CARD_BORDER_RADIUS, ARCHIVED_OPACITY } from '@/constants';

type Props = { note: Note; folder?: Folder; index?: number; onRestore?: () => void };

export function NoteCard({ note, folder, index = 0, onRestore }: Props) {
  const { colors } = useTheme();
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
  const isArchived = !!note.archived;
  return (
    <View
      className="bg-theme-paper rounded-card p-4 pb-3.5 border border-theme-line overflow-hidden"
      style={{
        transform: [{ rotate: `${tilt}deg` }],
        ...SHADOW_CARD,
        opacity: isArchived ? ARCHIVED_OPACITY : 1,
      }}
    >
      <GrainOverlay />

      {/* Content row — text + pin */}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <LinkedText text={note.text} links={note.links} numberOfLines={3} />
        </View>
        {note.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
      </View>

      {/* Bottom row — folder + restore */}
      {(folder || onRestore) && (
        <View className="flex-row items-center gap-1.5 mt-2.5">
          {folder && (
            <>
              <ColorDot color={folder.color} size={7} />
              <ThemeText variant="chip" size={11.5} color="ink3" letterSpacing={0.3}>
                {folder.name}
              </ThemeText>
            </>
          )}
          {onRestore && (
            <View className="ml-auto">
              <RestoreChip onRestore={onRestore} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
