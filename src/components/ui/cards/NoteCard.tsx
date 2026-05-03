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
      style={{
        backgroundColor: colors.paper,
        borderRadius: CARD_BORDER_RADIUS,
        padding: 16,
        paddingBottom: 14,
        borderWidth: 1,
        borderColor: colors.line,
        transform: [{ rotate: `${tilt}deg` }],
        ...SHADOW_CARD,
        overflow: 'hidden',
        opacity: isArchived ? ARCHIVED_OPACITY : 1,
      }}
    >
      <GrainOverlay />

      {/* Content row — text + pin */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <LinkedText text={note.text} links={note.links} />
        </View>
        {note.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
      </View>

      {/* Bottom row — folder + restore */}
      {(folder || onRestore) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
          {folder && (
            <>
              <ColorDot color={folder.color} size={7} />
              <ThemeText variant="chip" size={11.5} color="ink3" letterSpacing={0.3}>
                {folder.name}
              </ThemeText>
            </>
          )}
          {onRestore && (
            <View style={{ marginLeft: 'auto' }}>
              <RestoreChip onRestore={onRestore} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
