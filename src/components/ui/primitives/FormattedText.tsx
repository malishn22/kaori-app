import React, { useMemo } from 'react';
import { Text, View, TouchableOpacity, Linking, type TextStyle } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { CheckIcon } from '@/assets/icons';
import { getDomain } from '@/utils/links';
import { parseNoteText, type FormattedLine, type FormattedSegment } from '@/utils/noteFormat';

type Props = {
  text: string;
  links?: Record<string, string>;
  size?: number;
  lineHeight?: number;
  letterSpacing?: number;
  numberOfLines?: number;
  onLinkPress?: (url: string, label: string) => void;
  style?: TextStyle;
  onCheckboxToggle?: (lineIndex: number) => void;
};

function renderSegments(
  segments: FormattedSegment[],
  baseStyle: TextStyle,
  strikeStyle: TextStyle,
  linkStyle: TextStyle,
  links: Record<string, string>,
  onLinkPress?: (url: string, label: string) => void,
) {
  return segments.map((seg, i) => {
    if (seg.type === 'strikethrough') {
      return (
        <Text key={i} style={strikeStyle}>
          {seg.value}
        </Text>
      );
    }
    if (seg.type === 'url') {
      const label = links[seg.value] || getDomain(seg.value);
      return (
        <Text
          key={i}
          style={linkStyle}
          onPress={() => (onLinkPress ? onLinkPress(seg.value, label) : Linking.openURL(seg.value))}
        >
          {label}
        </Text>
      );
    }
    return seg.value;
  });
}

export function FormattedText({
  text,
  links = {},
  size = 15,
  lineHeight,
  letterSpacing,
  numberOfLines,
  onLinkPress,
  style: styleOverride,
  onCheckboxToggle,
}: Props) {
  const { colors } = useTheme();
  const lines = useMemo(() => parseNoteText(text), [text]);

  const baseStyle: TextStyle = {
    fontFamily: FONT.kalam,
    fontSize: size,
    color: colors.ink,
    ...(lineHeight ? { lineHeight } : {}),
    ...(letterSpacing != null ? { letterSpacing } : {}),
    ...styleOverride,
  };

  const strikeStyle: TextStyle = {
    ...baseStyle,
    textDecorationLine: 'line-through',
  };

  const linkStyle: TextStyle = {
    ...baseStyle,
    color: colors.amber,
    textDecorationLine: 'underline',
    textDecorationColor: colors.amber,
  };

  // Preview mode: flat single <Text> tree so numberOfLines truncation works
  if (numberOfLines != null) {
    return (
      <Text style={baseStyle} numberOfLines={numberOfLines}>
        {lines.map((line, lineIdx) => {
          const separator = lineIdx > 0 ? '\n' : '';
          const prefix = line.type === 'checkbox' ? (line.checked ? '☑ ' : '☐ ') : '';

          return (
            <Text key={lineIdx}>
              {separator}
              {prefix}
              {renderSegments(line.segments, baseStyle, strikeStyle, linkStyle, links, onLinkPress)}
            </Text>
          );
        })}
      </Text>
    );
  }

  // Detail mode: per-line View rows, checkboxes are interactive
  return (
    <View>
      {lines.map((line, lineIdx) => (
        <LineRow
          key={lineIdx}
          line={line}
          lineIdx={lineIdx}
          baseStyle={baseStyle}
          strikeStyle={strikeStyle}
          linkStyle={linkStyle}
          links={links}
          onLinkPress={onLinkPress}
          onCheckboxToggle={onCheckboxToggle}
          colors={colors}
        />
      ))}
    </View>
  );
}

type LineRowProps = {
  line: FormattedLine;
  lineIdx: number;
  baseStyle: TextStyle;
  strikeStyle: TextStyle;
  linkStyle: TextStyle;
  links: Record<string, string>;
  onLinkPress?: (url: string, label: string) => void;
  onCheckboxToggle?: (lineIndex: number) => void;
  colors: Record<string, string>;
};

function LineRow({
  line,
  lineIdx,
  baseStyle,
  strikeStyle,
  linkStyle,
  links,
  onLinkPress,
  onCheckboxToggle,
  colors,
}: LineRowProps) {
  const lineHeight = baseStyle.lineHeight as number | undefined;
  const circleSize = 18;

  if (line.type === 'checkbox') {
    const textStyle: TextStyle = {
      ...baseStyle,
      ...(line.checked ? { opacity: 0.45 } : {}),
    };
    const strikeCheckedStyle: TextStyle = {
      ...strikeStyle,
      ...(line.checked ? { opacity: 0.45 } : {}),
    };

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 2,
          minHeight: lineHeight,
        }}
      >
        <TouchableOpacity
          onPress={() => onCheckboxToggle?.(lineIdx)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderWidth: 1.5,
            borderColor: line.checked ? colors.amber : colors.line2,
            backgroundColor: line.checked ? colors.amber : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            marginTop: lineHeight ? (lineHeight - circleSize) / 2 : 2,
          }}
        >
          {line.checked && <CheckIcon size={10} color={colors.paper} strokeWidth={2.5} />}
        </TouchableOpacity>
        <Text style={[textStyle, { flex: 1 }]}>
          {renderSegments(
            line.segments,
            textStyle,
            strikeCheckedStyle,
            line.checked ? { ...linkStyle, opacity: 0.45 } : linkStyle,
            links,
            onLinkPress,
          )}
        </Text>
      </View>
    );
  }

  // Plain line
  return (
    <Text style={baseStyle}>
      {renderSegments(line.segments, baseStyle, strikeStyle, linkStyle, links, onLinkPress)}
    </Text>
  );
}
