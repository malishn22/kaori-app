import React, { type ReactNode } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@/hooks';

type Props = {
  children: ReactNode;
  toolbar: ReactNode;
  toolbarVisible?: boolean;
};

export function EditorScreen({ children, toolbar, toolbarVisible = true }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  return (
    <View className="flex-1 bg-theme-bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? 46 : 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {children}
      </ScrollView>

      {toolbarVisible && (
        <View>
          <View
            style={{ marginBottom: keyboardHeight, paddingBottom: Math.min(insets.bottom, 50) }}
          >
            {toolbar}
          </View>
          {/* Covers the gap behind the toolbar during keyboard open/close animation */}
          <View
            style={{
              position: 'absolute',
              bottom: -keyboardHeight,
              left: 0,
              right: 0,
              height: keyboardHeight,
            }}
            className="bg-theme-bg"
          />
        </View>
      )}
    </View>
  );
}
