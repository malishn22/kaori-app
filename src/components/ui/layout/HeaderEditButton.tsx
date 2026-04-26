import React from 'react';
import { TouchableOpacity } from 'react-native';
import { IconPen } from '@/assets/icons';

export function HeaderEditButton({ onPress, color }: { onPress?: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={12} activeOpacity={0.7}>
      <IconPen size={24} color={color} />
    </TouchableOpacity>
  );
}
