import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { IconPlus } from '@/assets/icons';
import { ThemeText } from '../primitives/ThemeText';

type Props = {
  onPress: () => void;
  wide?: boolean;
  label?: string;
  bottomOffset?: number;
  rightOffset?: number;
  bottomGap?: number;
};

export function FAB({
  onPress,
  wide = false,
  label = '',
  bottomOffset = 0,
  rightOffset = 20,
  bottomGap = 20,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const rawBottomInset = insets.bottom;
  const bottomInsetForFab = Platform.OS === 'android'
    ? Math.min(rawBottomInset, 12)
    : rawBottomInset;

  const bottom = bottomInsetForFab + bottomOffset + bottomGap;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        position: 'absolute',
        right: rightOffset,
        bottom,
        zIndex: 30,
        height: 64,
        width: wide ? undefined : 64,
        paddingHorizontal: wide ? 22 : 0,
        borderRadius: 22,
        backgroundColor: colors.amber,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: colors.amber,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.22,
        shadowRadius: 32,
        elevation: 10,
      }}
    >
      <IconPlus size={26} color="#1a140a" strokeWidth={2.4} />
      {wide && (
        <ThemeText variant="button" color="#1a140a" letterSpacing={0.2}>
          {label}
        </ThemeText>
      )}
    </TouchableOpacity>
  );
}
