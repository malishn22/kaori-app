import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import type { Idea, Project } from '@/types';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { ColorDot } from '../primitives/ColorDot';
import { BookmarkIcon } from '@/assets/icons';

const TILTS = [-0.4, 0.3, -0.2, 0.5, -0.3];

type Props = { idea: Idea; project?: Project; index?: number };

export function PaperCard({ idea, project: proj, index = 0 }: Props) {
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 6,
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
          {idea.pinned && <BookmarkIcon size={11} color={colors.amber} fill={colors.amber} />}
          <ThemeText variant="meta" size={11} color="ink4">{idea.time}</ThemeText>
        </View>
      </View>
      <ThemeText variant="body">{idea.text}</ThemeText>
    </View>
  );
}
