import React from 'react';
import type { Task, Folder } from '@/types';
import { ContentCard } from './ContentCard';

type Props = {
  task: Task;
  folder?: Folder;
  index?: number;
  onToggle: () => void;
  onPress: () => void;
  onRestore?: () => void;
};

export function TaskCard({ task, folder, index = 0, onToggle, onPress, onRestore }: Props) {
  return (
    <ContentCard
      kind="task"
      task={task}
      folder={folder}
      index={index}
      onPress={onPress}
      onToggle={onToggle}
      onRestore={onRestore}
    />
  );
}
