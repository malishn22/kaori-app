import React from 'react';
import { View, TextInput as RNTextInput } from 'react-native';
import { FONT } from '@/theme';
import { Input } from './Input';
import { ThemeText } from './ThemeText';
import type { TextInputProps as RNTextInputProps } from 'react-native';

interface CountedInputProps extends RNTextInputProps {
  maxLength: number;
}

export const CountedInput = React.forwardRef<RNTextInput, CountedInputProps>(
  ({ style, value = '', maxLength, ...props }, ref) => {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Input
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
