import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { ThemeText } from '../primitives/ThemeText';
import { ArrowIcon } from '@/assets/icons';
import { BUTTON_TEXT_ON_ACCENT, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants';

type Props = {
  onCancel: () => void;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
};

export function SheetButtonRow({ onCancel, onAction, actionLabel, actionDisabled = false }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <TouchableOpacity
        onPress={onCancel}
        style={{
          flex: 1, height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS,
          borderWidth: 1, borderColor: colors.line2,
          alignItems: 'center', justifyContent: 'center',
        }}
        activeOpacity={0.7}
      >
        <ThemeText variant="label" size={14} color="ink2" style={{ fontFamily: FONT.geistMedium }}>cancel</ThemeText>
      </TouchableOpacity>
      {onAction && actionLabel && (
        <TouchableOpacity
          onPress={onAction}
          disabled={actionDisabled}
          style={{
            flex: 2, height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS,
            backgroundColor: colors.amber,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: actionDisabled ? 0.4 : 1,
          }}
          activeOpacity={0.85}
        >
          <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>{actionLabel}</ThemeText>
          <ArrowIcon size={16} color={BUTTON_TEXT_ON_ACCENT} strokeWidth={2.2} />
        </TouchableOpacity>
      )}
    </View>
  );
}
