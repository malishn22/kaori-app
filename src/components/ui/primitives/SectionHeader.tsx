import React from 'react';
import { View } from 'react-native';
import { ThemeText } from './ThemeText';
import { Underline } from './Underline';

type SectionHeaderProps = {
  title: string;
  underlineWidth?: number;
};

export function SectionHeader({ title, underlineWidth = 52 }: SectionHeaderProps) {
  return (
    <View>
      <ThemeText variant="subheading" style={{ marginBottom: 6 }}>{title}</ThemeText>
      <Underline width={underlineWidth} />
    </View>
  );
}
