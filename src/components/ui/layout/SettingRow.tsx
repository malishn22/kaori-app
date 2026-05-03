import React from 'react';
import { Switch } from 'react-native';
import { useTheme } from '@/theme';
import { MenuRow } from './MenuRow';

type SettingRowProps = {
  icon: React.ReactNode;
  label: string;
  right: React.ReactNode;
  onPress?: () => void;
  borderBottom?: boolean;
};

export function SettingRow({ icon, label, right, onPress, borderBottom = false }: SettingRowProps) {
  return (
    <MenuRow
      icon={icon}
      label={label}
      right={right}
      onPress={onPress}
      borderBottom={borderBottom}
      textVariant="label"
      paddingHorizontal={0}
      paddingVertical={13}
      gap={14}
    />
  );
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
