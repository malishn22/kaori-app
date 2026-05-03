import React from 'react';
import { useTheme } from '@/theme';
import { Chip } from './Chip';
import { ThemeText } from './ThemeText';

type Props = { onRestore: () => void };

export function RestoreChip({ onRestore }: Props) {
  const { colors } = useTheme();
  return (
    <Chip color={colors.amber} active onPress={onRestore} paddingVertical={4}>
      <ThemeText variant="chip" size={12} color="amber">restore</ThemeText>
    </Chip>
  );
}
