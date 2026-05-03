import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { ThemeText } from '../primitives/ThemeText';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ProjectAvatar } from './ProjectAvatar';
import { Chip } from '../primitives/Chip';
import { ChevronIcon, BookmarkIcon } from '@/assets/icons';
import { SHADOW_CARD } from '@/constants';
import type { Project } from '@/types';

const TILTS = [-0.4, 0.3, -0.2, 0.5, -0.3];

type ProjectCardProps = {
  project: Project;
  index: number;
  noteCount: number;
  taskCount: number;
  onRestore?: () => void;
};

export function ProjectCard({ project, index, noteCount, taskCount, onRestore }: ProjectCardProps) {
  const { colors } = useTheme();
  const tilt = TILTS[index % TILTS.length];
  const isArchived = !!project.archived;

  return (
    <View style={{
      backgroundColor: colors.paper,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
      transform: [{ rotate: `${tilt}deg` }],
      ...SHADOW_CARD,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      overflow: 'hidden',
      opacity: isArchived ? 0.5 : 1,
    }}>
      <GrainOverlay />
      <ProjectAvatar name={project.name} color={project.color} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <ThemeText variant="title">{project.name}</ThemeText>
        <ThemeText variant="chip" color="ink3" style={{ marginTop: 4 }}>
          {noteCount} notes · {taskCount} tasks
        </ThemeText>
      </View>
      {project.pinned && <BookmarkIcon size={13} color={colors.amber} fill={colors.amber} />}
      {onRestore && (
        <Chip color={colors.amber} active onPress={onRestore} paddingVertical={4}>
          <ThemeText variant="chip" size={12} color="amber">restore</ThemeText>
        </Chip>
      )}
      {!isArchived && <ChevronIcon size={14} color={colors.ink4} />}
    </View>
  );
}
