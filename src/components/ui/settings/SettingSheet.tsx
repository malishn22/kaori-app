import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { useHapticFeedback, useBottomSheetControl } from '@/hooks';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { SectionTitle } from '../primitives/SectionTitle';
import { ColorDot } from '../primitives/ColorDot';
import { BottomSheet } from '../sheets/BottomSheet';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  visible: boolean;
  title: string;
  options: Option<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

export function SettingSheet<T extends string>({ visible, title, options, value, onSelect, onClose }: Props<T>) {
  const { colors } = useTheme();
  const sheetRef = useBottomSheetControl(visible);
  const { impact } = useHapticFeedback();

  function handleSelect(v: T) {
    impact();
    onSelect(v);
    onClose();
  }

  function handleChange(index: number) {
    if (index === -1) onClose();
  }

  return (
    <BottomSheet sheetRef={sheetRef} onChange={handleChange}>
      <View style={{ paddingTop: 12, paddingHorizontal: 22 }}>
        <GrainOverlay />

        <SectionTitle showUnderline={false} style={{ marginBottom: 16 }}>{title}</SectionTitle>

        {options.map((opt, ix) => {
          const isActive = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleSelect(opt.value)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                borderBottomWidth: ix < options.length - 1 ? 1 : 0,
                borderBottomColor: colors.line,
              }}
            >
              <ThemeText variant="body" color={isActive ? 'amber' : 'ink'}>
                {opt.label}
              </ThemeText>
              {isActive && <ColorDot color={colors.amber} size={8} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}
