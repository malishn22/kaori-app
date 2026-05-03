import React from 'react';
import { Platform, View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { CircleIcon, TaskIcon, FolderIcon } from '@/assets/icons';
import { ThemeText } from '../primitives/ThemeText';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE_HEIGHT, TAB_BAR_BOTTOM_INSET } from '@/constants/layout';

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const rawBottomInset = insets.bottom;
  const bottomInsetForTabBar = Platform.OS === 'android'
    ? Math.min(rawBottomInset, 12)
    : rawBottomInset;

  const tabBarPaddingBottom = bottomInsetForTabBar + 16;
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + tabBarPaddingBottom;
  const tabs = [
    { key: 'index', label: 'today', Icon: CircleIcon },
    { key: 'tasks', label: 'tasks', Icon: TaskIcon },
    { key: 'projects', label: 'projects', Icon: FolderIcon },
  ];

  return (
    <View
      className="absolute left-0 right-0 border-t border-theme-line bg-theme-bg flex-row items-center justify-around"
      style={{
        bottom: TAB_BAR_BOTTOM_INSET,
        height: tabBarHeight,
        paddingBottom: tabBarPaddingBottom,
      }}
    >
      {tabs.map((tab, i) => {
        const isActive = state.index === i;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => navigation.navigate(tab.key)}
            className="flex-1 items-center gap-1"
            activeOpacity={0.7}
          >
            <tab.Icon size={20} color={isActive ? colors.amber : colors.ink4} strokeWidth={1.5} />
            <ThemeText variant="tab" color={isActive ? colors.cream : colors.ink4}>
              {tab.label}
            </ThemeText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
