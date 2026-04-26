import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/ui';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
