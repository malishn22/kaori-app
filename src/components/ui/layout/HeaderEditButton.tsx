import React from 'react';
import { TouchableOpacity } from 'react-native';
import { EditIcon } from '@/assets/icons';

export function HeaderEditButton({ onPress, color }: { onPress?: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={12} activeOpacity={0.7}>
      <EditIcon size={24} color={color} />
    </TouchableOpacity>
  );
}
