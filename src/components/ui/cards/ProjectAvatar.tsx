import React from 'react';
import { View } from 'react-native';
import { ThemeText } from '../primitives/ThemeText';
import { projectAvatarStyle } from '@/constants';

type Props = {
  name: string;
  color: string;
};

export function ProjectAvatar({ name, color }: Props) {
  return (
    <View style={projectAvatarStyle(color)}>
      <ThemeText variant="heading" color={color}>
        {name.charAt(0).toLowerCase()}
      </ThemeText>
    </View>
  );
}
