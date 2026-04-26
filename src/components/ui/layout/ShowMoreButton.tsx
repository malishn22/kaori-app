import React from 'react';
import { TouchableOpacity } from 'react-native';
import { IconMore } from '@/assets/icons';

export function ShowMoreButton({ onPress, color }: { onPress?: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={12} activeOpacity={0.7}>
      <IconMore size={26} color={color} />
    </TouchableOpacity>
  );
}
