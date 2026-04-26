import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import type { Note, Project } from '@/types';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { ColorDot } from '../primitives/ColorDot';
import { BookmarkIcon } from '@/assets/icons';
import { SHADOW_CARD } from '@/constants';

const TILTS = [-0.4, 0.3, -0.2, 0.5, -0.3];

type Props = { note: Note; project?: Project; index?: number };

export function PaperCard({ note, project: proj, index = 0 }: Props) {
  const { colors } = useTheme();
  const tilt = TILTS[index % TILTS.length];

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
      }}
    >
      <GrainOverlay />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        {proj ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ColorDot color={proj.color} size={7} />
            <ThemeText variant="meta" size={11.5} letterSpacing={0.3}>
              {proj.name}
            </ThemeText>
          </View>
        ) : (
          <View />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {note.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
          <ThemeText variant="meta" size={11} color="ink4">{note.time}</ThemeText>
        </View>
      </View>
      <ThemeText variant="body">{note.text}</ThemeText>
    </View>
  );
}
