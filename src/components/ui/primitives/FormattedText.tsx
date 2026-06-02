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

const INDICATOR_SLOT = 18;
const ROW_FALLBACK_MARGIN_TOP = 2;
const BULLET_INDENT_STEP = 20;

const DOT_SIZE_FILLED = 6;
const DOT_SIZE_SQUARE = 4;
const DOT_BORDER_WIDTH = 1.5;

const CHECKBOX_BORDER_WIDTH = 1.5;
const CHECKBOX_HIT_SLOP = 6;
const CHECK_ICON_SIZE = 10;
const CHECK_ICON_STROKE = 2.5;

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
    let numberedCounter = 0;
    return (
      <Text style={baseStyle} numberOfLines={numberOfLines}>
        {lines.map((line, lineIdx) => {
          if (line.type === 'numbered') {
            numberedCounter++;
          } else {
            numberedCounter = 0;
          }
          const separator = lineIdx > 0 ? '\n' : '';
          const prefix =
            line.type === 'checkbox'
              ? line.checked
                ? '☑ '
                : '☐ '
              : line.type === 'dotted'
                ? line.level === 1
                  ? '• '
                  : line.level === 2
                    ? '◦ '
                    : '▪ '
                : line.type === 'numbered'
                  ? `${numberedCounter}. `
                  : '';

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
  let seq = 0;
  return (
    <View>
      {lines.map((line, lineIdx) => {
        if (line.type === 'numbered') {
          seq++;
        } else {
          seq = 0;
        }
        return (
          <LineRow
            key={lineIdx}
            line={line}
            lineIdx={lineIdx}
            sequentialNumber={seq}
            baseStyle={baseStyle}
            strikeStyle={strikeStyle}
            linkStyle={linkStyle}
            links={links}
            onLinkPress={onLinkPress}
            onCheckboxToggle={onCheckboxToggle}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

type LineRowProps = {
  line: FormattedLine;
  lineIdx: number;
  sequentialNumber: number;
  baseStyle: TextStyle;
  strikeStyle: TextStyle;
  linkStyle: TextStyle;
  links: Record<string, string>;
  onLinkPress?: (url: string, label: string) => void;
  onCheckboxToggle?: (lineIndex: number) => void;
  colors: Record<string, string>;
};

function getDotStyle(level: number, colors: Record<string, string>): object {
  if (level === 2) {
    return {
      width: DOT_SIZE_FILLED,
      height: DOT_SIZE_FILLED,
      borderRadius: DOT_SIZE_FILLED / 2,
      borderWidth: DOT_BORDER_WIDTH,
      borderColor: colors.ink3,
    };
  }
  if (level >= 3) {
    return {
      width: DOT_SIZE_SQUARE,
      height: DOT_SIZE_SQUARE,
      borderRadius: 0,
      backgroundColor: colors.ink3,
    };
  }
  return {
    width: DOT_SIZE_FILLED,
    height: DOT_SIZE_FILLED,
    borderRadius: DOT_SIZE_FILLED / 2,
    backgroundColor: colors.ink3,
  };
}

function LineRow({
  line,
  lineIdx,
  sequentialNumber,
  baseStyle,
  strikeStyle,
  linkStyle,
  links,
  onLinkPress,
  onCheckboxToggle,
  colors,
}: LineRowProps) {
  const lineHeight = baseStyle.lineHeight as number | undefined;

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
      <View className="flex-row items-start mb-0.5" style={{ minHeight: lineHeight }}>
        <TouchableOpacity
          onPress={() => onCheckboxToggle?.(lineIdx)}
          className="items-center justify-center"
          hitSlop={{
            top: CHECKBOX_HIT_SLOP,
            bottom: CHECKBOX_HIT_SLOP,
            left: CHECKBOX_HIT_SLOP,
            right: CHECKBOX_HIT_SLOP,
          }}
          style={{
            width: INDICATOR_SLOT,
            height: INDICATOR_SLOT,
            borderRadius: INDICATOR_SLOT / 2,
            borderWidth: CHECKBOX_BORDER_WIDTH,
            borderColor: line.checked ? colors.amber : colors.line2,
            backgroundColor: line.checked ? colors.amber : 'transparent',
            marginRight: 8,
            marginTop: lineHeight ? (lineHeight - INDICATOR_SLOT) / 2 : ROW_FALLBACK_MARGIN_TOP,
          }}
        >
          {line.checked && (
            <CheckIcon
              size={CHECK_ICON_SIZE}
              color={colors.paper}
              strokeWidth={CHECK_ICON_STROKE}
            />
          )}
        </TouchableOpacity>
        <Text className="flex-1" style={textStyle}>
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

  if (line.type === 'dotted') {
    const indent = (line.level - 1) * BULLET_INDENT_STEP;
    return (
      <View
        className="flex-row items-start mb-0.5"
        style={{ minHeight: lineHeight, marginLeft: indent }}
      >
        <View
          className="items-center justify-center"
          style={{
            width: INDICATOR_SLOT,
            height: INDICATOR_SLOT,
            marginRight: 8,
            marginTop: lineHeight ? (lineHeight - INDICATOR_SLOT) / 2 : ROW_FALLBACK_MARGIN_TOP,
          }}
        >
          <View style={getDotStyle(line.level, colors)} />
        </View>
        <Text className="flex-1" style={baseStyle}>
          {renderSegments(line.segments, baseStyle, strikeStyle, linkStyle, links, onLinkPress)}
        </Text>
      </View>
    );
  }

  if (line.type === 'numbered') {
    return (
      <View className="flex-row items-start mb-0.5" style={{ minHeight: lineHeight }}>
        <View
          className="items-center justify-center"
          style={{
            width: INDICATOR_SLOT,
            height: INDICATOR_SLOT,
            marginRight: 8,
            marginTop: lineHeight ? (lineHeight - INDICATOR_SLOT) / 2 : ROW_FALLBACK_MARGIN_TOP,
          }}
        >
          <Text
            style={{
              fontFamily: baseStyle.fontFamily,
              fontSize: (baseStyle.fontSize ?? 15) * 0.72,
              color: colors.ink3,
              lineHeight: INDICATOR_SLOT,
            }}
          >
            {sequentialNumber}.
          </Text>
        </View>
        <Text className="flex-1" style={baseStyle}>
          {renderSegments(line.segments, baseStyle, strikeStyle, linkStyle, links, onLinkPress)}
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
