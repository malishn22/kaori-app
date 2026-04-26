import React from 'react';
import { View } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { Input } from './Input';
import { ThemeText } from './ThemeText';
import type { TextInputProps as RNTextInputProps } from 'react-native';

interface TextInputProps extends RNTextInputProps {
  asBottomSheet?: boolean;
  maxLength: number;
}

export const TextInput = React.forwardRef<any, TextInputProps>(
  ({ asBottomSheet, style, value = '', maxLength, ...props }, ref) => {
    const { colors } = useTheme();
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.line2,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}>
        <Input
          asBottomSheet={asBottomSheet}
          ref={ref}
          style={[{ flex: 1 }, style]}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        <ThemeText variant="meta" color="ink4" style={{ fontFamily: FONT.kalam }}>
          {String(value).length}/{maxLength}
        </ThemeText>
      </View>
    );
  }
);
