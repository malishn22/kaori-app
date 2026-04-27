import React, { useMemo } from 'react';
import { Text, Linking, type TextStyle } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { extractUrls, getDomain } from '@/utils/links';

type Props = {
  text: string;
  links?: Record<string, string>;
  variant?: 'body' | 'heading';
  size?: number;
  lineHeight?: number;
  letterSpacing?: number;
  onLinkPress?: (url: string, currentLabel: string) => void;
};

type Segment = { type: 'text'; value: string } | { type: 'url'; value: string };

function splitTextByUrls(text: string): Segment[] {
  const urls = extractUrls(text);
  if (urls.length === 0) return [{ type: 'text', value: text }];

  const segments: Segment[] = [];
  let remaining = text;

  for (const url of urls) {
    const idx = remaining.indexOf(url);
    if (idx === -1) continue;

    if (idx > 0) {
      segments.push({ type: 'text', value: remaining.slice(0, idx) });
    }
    segments.push({ type: 'url', value: url });
    remaining = remaining.slice(idx + url.length);
  }

  if (remaining) {
    segments.push({ type: 'text', value: remaining });
  }

  return segments;
}

const VARIANT_STYLES: Record<string, { fontFamily: string; fontSize: number; color?: string; lineHeight?: number; letterSpacing?: number }> = {
  body: { fontFamily: FONT.geist, fontSize: 15, color: 'ink', lineHeight: 22, letterSpacing: -0.05 },
  heading: { fontFamily: FONT.kalam, fontSize: 22, color: 'ink' },
};

export function LinkedText({ text, links = {}, variant = 'body', size, lineHeight, letterSpacing, onLinkPress }: Props) {
  const { colors } = useTheme();
  const segments = useMemo(() => splitTextByUrls(text), [text]);

  const v = VARIANT_STYLES[variant];
  const baseStyle: TextStyle = {
    fontFamily: v.fontFamily,
    fontSize: size ?? v.fontSize,
    color: colors[v.color as keyof typeof colors] ?? colors.ink,
    ...(lineHeight ?? v.lineHeight ? { lineHeight: lineHeight ?? v.lineHeight } : {}),
    ...(letterSpacing ?? v.letterSpacing ? { letterSpacing: letterSpacing ?? v.letterSpacing } : {}),
  };

  const linkStyle: TextStyle = {
    ...baseStyle,
    color: colors.amber,
    textDecorationLine: 'underline',
    textDecorationColor: colors.amber,
  };

  return (
    <Text style={baseStyle}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return seg.value;

        const label = links[seg.value] || getDomain(seg.value);
        return (
          <Text
            key={i}
            style={linkStyle}
            onPress={() => onLinkPress ? onLinkPress(seg.value, label) : Linking.openURL(seg.value)}
          >
            {label}
          </Text>
        );
      })}
    </Text>
  );
}
