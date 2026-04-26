import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { IconCircle, IconFolder } from '@/assets/icons';
import { ThemeText } from '@/components/ui';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

function KaoriTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const rawBottomInset = insets.bottom;
  const bottomInsetForTabBar = Platform.OS === 'android'
    ? Math.min(rawBottomInset, 12)
    : rawBottomInset;

  const tabBarPaddingBottom = bottomInsetForTabBar + 16;
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + tabBarPaddingBottom;
  const tabs = [
    { key: 'index', label: 'today', Icon: IconCircle },
    { key: 'projects', label: 'projects', Icon: IconFolder },
  ];

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: tabBarHeight,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: colors.bg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: tabBarPaddingBottom,
      }}
    >
      {tabs.map((tab, i) => {
        const isActive = state.index === i;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => navigation.navigate(tab.key)}
            style={{ alignItems: 'center', gap: 4 }}
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

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <KaoriTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
