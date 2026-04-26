import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { CheckIcon } from '@/assets/icons';
import { PROJECT_COLORS, BUTTON_TEXT_ON_ACCENT, colorSwatchStyle } from '@/constants';

type Props = {
  selectedColor: string;
  onSelect: (color: string) => void;
};

export function ColorSwatchPicker({ selectedColor, onSelect }: Props) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {PROJECT_COLORS.map((color) => {
        const isSelected = selectedColor === color;
        return (
          <TouchableOpacity
            key={color}
            onPress={() => onSelect(color)}
            activeOpacity={0.8}
            style={colorSwatchStyle(color, isSelected)}
          >
            {isSelected && <CheckIcon size={14} color={BUTTON_TEXT_ON_ACCENT} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
