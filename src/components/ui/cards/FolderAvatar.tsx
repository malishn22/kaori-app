import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeText } from '../primitives/ThemeText';
import { useTheme } from '@/theme';

type Props = {
  name: string;
  color: string;
};

export function FolderAvatar({ name, color }: Props) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[color, colors.ink3]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
    >
      <ThemeText variant="heading" color="bg">
        {name.charAt(0).toLowerCase()}
      </ThemeText>
    </LinearGradient>
  );
}
