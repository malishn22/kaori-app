import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { PlusIcon } from '@/assets/icons';
import { ThemeText } from '../primitives/ThemeText';
import { BUTTON_TEXT_ON_ACCENT } from '@/constants';
import { TAB_BAR_BASE_HEIGHT, TAB_BAR_BOTTOM_INSET } from '@/constants/layout';

type Props = {
  onPress: () => void;
  wide?: boolean;
  label?: string;
  rightOffset?: number;
  bottomGap?: number;
};

export function FAB({
  onPress,
  wide = false,
  label = '',
  rightOffset = 20,
  bottomGap = 20,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const rawBottomInset = insets.bottom;
  const bottomInsetForFab = Platform.OS === 'android'
    ? Math.min(rawBottomInset, 12)
    : rawBottomInset;

  const bottom = bottomInsetForFab + TAB_BAR_BASE_HEIGHT + TAB_BAR_BOTTOM_INSET + bottomGap;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="absolute z-30 h-16 rounded-[22px] bg-theme-amber flex-row items-center justify-center gap-2.5"
      style={{
        right: rightOffset,
        bottom,
        width: wide ? undefined : 64,
        paddingHorizontal: wide ? 22 : 0,
        shadowColor: colors.amber,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.22,
        shadowRadius: 32,
        elevation: 10,
      }}
    >
      <PlusIcon size={26} color={BUTTON_TEXT_ON_ACCENT} strokeWidth={2.4} />
      {wide && (
        <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT} letterSpacing={0.2}>
          {label}
        </ThemeText>
      )}
    </TouchableOpacity>
  );
}
