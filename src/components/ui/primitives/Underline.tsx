import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme';

type Props = { width?: number; color?: string };

export function Underline({ width = 60, color }: Props) {
  const { colors } = useTheme();
  const stroke = color ?? colors.amber;
  const w = width;
  return (
    <Svg width={w} height={6} viewBox={`0 0 ${w} 6`}>
      <Path
        d={`M2 4 Q${w / 2} 0 ${w - 2} 4`}
        stroke={stroke}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        opacity={0.7}
      />
    </Svg>
  );
}
