import React from 'react';
import { TextInput, type TextInputProps, type TextInput as RNTextInput } from 'react-native';
import { useTheme, FONT } from '@/theme';

export const Input = React.forwardRef<RNTextInput, TextInputProps>(
  ({ style, ...props }, ref) => {
    const { colors } = useTheme();

    const baseStyle = {
      fontFamily: FONT.kalam,
      fontSize: 16,
      color: colors.ink,
      letterSpacing: -0.05 as const,
    };

    return (
      <TextInput
        ref={ref}
        placeholderTextColor={colors.ink4}
        selectionColor={colors.amber}
        cursorColor={colors.amber}
        style={[baseStyle, style]}
        {...props}
      />
    );
  }
);
