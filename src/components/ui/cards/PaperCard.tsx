import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import type { Note, Project } from '@/types';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { LinkedText } from '../primitives/LinkedText';
import { ColorDot } from '../primitives/ColorDot';
import { Chip } from '../primitives/Chip';
import { BookmarkIcon } from '@/assets/icons';
import { SHADOW_CARD } from '@/constants';

const TILTS = [-0.4, 0.3, -0.2, 0.5, -0.3];

type Props = { note: Note; project?: Project; index?: number; onRestore?: () => void };

export function PaperCard({ note, project: proj, index = 0, onRestore }: Props) {
  const { colors } = useTheme();
  const tilt = TILTS[index % TILTS.length];
  const isArchived = !!note.archived;
  return (
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

      {/* Content row — text + pin */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <LinkedText text={note.text} links={note.links} />
        </View>
        {note.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
      </View>

      {/* Bottom row — project + restore */}
      {(proj || onRestore) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
          {proj && (
            <>
              <ColorDot color={proj.color} size={7} />
              <ThemeText variant="chip" size={11.5} color="ink3" letterSpacing={0.3}>
                {proj.name}
              </ThemeText>
            </>
          )}
          {onRestore && (
            <View style={{ marginLeft: 'auto' }}>
              <Chip color={colors.amber} active onPress={onRestore} paddingVertical={4}>
                <ThemeText variant="chip" size={12} color="amber">restore</ThemeText>
              </Chip>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
