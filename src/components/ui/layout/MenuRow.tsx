import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { ThemeText } from '../primitives/ThemeText';
import { ChevronIcon } from '@/assets/icons';

type MenuRowProps = {
  icon?: React.ReactNode;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  borderBottom?: boolean;
  labelColor?: string;
  subtitleColor?: string;
  textVariant?: 'body' | 'label';
  showChevron?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
  gap?: number;
};

export function MenuRow({
  icon,
  label,
  subtitle,
  right,
  onPress,
  borderBottom = true,
  labelColor = 'ink2',
  subtitleColor = 'ink4',
  textVariant = 'body',
  showChevron = false,
  paddingHorizontal = 16,
  paddingVertical = 14,
  gap = 14,
}: MenuRowProps) {
  const { colors } = useTheme();

  const style = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap,
    paddingHorizontal,
    paddingVertical,
    ...(borderBottom ? { borderBottomWidth: 1, borderBottomColor: colors.line } : {}),
  };

  const content = (
    <>
      {icon}
      <View className="flex-1">
        <ThemeText variant={textVariant} color={labelColor}>{label}</ThemeText>
        {subtitle && <ThemeText variant="meta" color={subtitleColor} style={{ marginTop: 2 }}>{subtitle}</ThemeText>}
      </View>
      {right}
      {showChevron && <ChevronIcon size={14} color={colors.ink4} />}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={style}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={style}>{content}</View>;
}
