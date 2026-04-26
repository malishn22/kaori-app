import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme, FONT } from '@/theme';

type Variant = 'display' | 'heading' | 'subheading' | 'title' | 'body' | 'caption' | 'meta' | 'label' | 'button' | 'chip' | 'tab';

type ThemeTextProps = {
  variant?: Variant;
  color?: string;
  size?: number;
  lineHeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
  style?: TextStyle;
  children: React.ReactNode;
} & Omit<TextProps, 'style'>;

type VariantDef = {
  fontFamily: string;
  fontSize: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
};

const VARIANTS: Record<Variant, VariantDef> = {
  display:    { fontFamily: FONT.kalam, fontSize: 36, color: 'cream', lineHeight: 40 },
  heading:    { fontFamily: FONT.kalam, fontSize: 22, color: 'cream' },
  subheading: { fontFamily: FONT.kalam, fontSize: 18, color: 'cream' },
  title:      { fontFamily: FONT.kalam, fontSize: 19, color: 'ink',  lineHeight: 22 },
  body:       { fontFamily: FONT.geist, fontSize: 15, color: 'ink',  lineHeight: 22, letterSpacing: -0.05 },
  caption:    { fontFamily: FONT.geist, fontSize: 12, color: 'ink3', letterSpacing: 0.5, uppercase: true },
  meta:       { fontFamily: FONT.geist, fontSize: 12, color: 'ink3' },
  label:      { fontFamily: FONT.geist, fontSize: 14.5, color: 'ink' },
  button:     { fontFamily: FONT.kalam, fontSize: 18, letterSpacing: 0.3 },
  chip:       { fontFamily: FONT.kalam, fontSize: 14, color: 'ink' },
  tab:        { fontFamily: FONT.kalam, fontSize: 10.5, letterSpacing: 0.2 },
};

function resolveColor(color: string | undefined, colors: Record<string, string>): string | undefined {
  if (!color) return undefined;
  return color in colors ? colors[color] : color;
}

export function ThemeText({ variant = 'body', color, size, lineHeight, letterSpacing, uppercase, style, children, ...rest }: ThemeTextProps) {
  const { colors } = useTheme();
  const v = VARIANTS[variant];

  const resolvedColor = resolveColor(color ?? v.color, colors);
  const isUppercase = uppercase ?? v.uppercase;

  const merged: TextStyle = {
    fontFamily: v.fontFamily,
    fontSize: size ?? v.fontSize,
    color: resolvedColor,
    ...(lineHeight ?? v.lineHeight ? { lineHeight: lineHeight ?? v.lineHeight } : {}),
    ...(letterSpacing ?? v.letterSpacing ? { letterSpacing: letterSpacing ?? v.letterSpacing } : {}),
    ...(isUppercase ? { textTransform: 'uppercase' as const } : {}),
    ...style,
  };

  return <Text style={merged} {...rest}>{children}</Text>;
}
