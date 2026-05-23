import React from 'react';
import type { Note, Folder } from '@/types';
import { ContentCard } from './ContentCard';

type Props = {
  note: Note;
  folder?: Folder;
  index?: number;
  onRestore?: () => void;
  onPress: () => void;
};

export function NoteCard({ note, folder, index = 0, onRestore, onPress }: Props) {
  return (
    <ContentCard
      kind="note"
      note={note}
      folder={folder}
      index={index}
      onPress={onPress}
      onRestore={onRestore}
    />
  );
}
