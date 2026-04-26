import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme, FONT } from '@/theme';

interface InputProps extends TextInputProps {
  asBottomSheet?: boolean;
}

export function Input({ asBottomSheet = false, style, ...props }: InputProps) {
  const { colors } = useTheme();

  const baseStyle = {
    fontFamily: FONT.kalam,
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.05 as const,
  };

  const inputProps = {
    placeholderTextColor: colors.ink4,
    selectionColor: colors.amber,
    cursorColor: colors.amber,
    style: [baseStyle, style],
    ...props,
  };

  if (asBottomSheet) {
    return <BottomSheetTextInput {...inputProps} />;
  }

  return <TextInput {...inputProps} />;
}
