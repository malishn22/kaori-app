import React from 'react';
import { View, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { ThemeText } from '../primitives/ThemeText';

type SettingRowProps = {
  icon: React.ReactNode;
  label: string;
  right: React.ReactNode;
  onPress?: () => void;
  borderBottom?: boolean;
};

export function SettingRow({ icon, label, right, onPress, borderBottom = false }: SettingRowProps) {
  const { colors } = useTheme();

  const style = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    paddingVertical: 13,
    ...(borderBottom ? { borderBottomWidth: 1, borderBottomColor: colors.line } : {}),
  };

  const content = (
    <>
      {icon}
      <ThemeText variant="label" style={{ flex: 1 }}>{label}</ThemeText>
      {right}
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

type CustomSwitchProps = {
  value: boolean;
  onValueChange?: (v: boolean) => void;
};

export function CustomSwitch({ value, onValueChange }: CustomSwitchProps) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.ink4, true: colors.amber }}
      thumbColor={colors.cream}
      ios_backgroundColor={colors.ink4}
    />
  );
}
