import React from 'react';
import { View, ScrollView } from 'react-native';
import { Chip } from '../primitives/Chip';
import { ThemeText } from '../primitives/ThemeText';
import type { Folder } from '@/types';

type Props = {
  folders: Folder[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  label?: string;
};

export function FolderChipSelector({ folders, selected, onSelect, label }: Props) {
  return (
    <View className={label ? 'mt-6' : ''}>
      {label && (
        <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
          {label}
        </ThemeText>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5">
          <Chip active={selected === null} onPress={() => onSelect(null)}>
            <ThemeText variant="chip" size={13} color={selected === null ? 'ink' : 'ink2'}>none</ThemeText>
          </Chip>
          {folders.map(f => (
            <Chip key={f.id} color={f.color} active={selected === f.id} dot dotSize={5} onPress={() => onSelect(f.id)}>
              <ThemeText variant="chip" size={13} color={selected === f.id ? f.color : 'ink2'}>{f.name}</ThemeText>
            </Chip>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
