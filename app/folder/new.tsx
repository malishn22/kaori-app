import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback } from '@/hooks';
import { PageHeader, ThemeText, ColorSwatchPicker, CountedInput } from '@/components/ui';
import { FOLDER_COLORS, BUTTON_TEXT_ON_ACCENT } from '@/constants';

export default function NewFolderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addFolder } = useStore();
  const { impactOnSave } = useHapticFeedback();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  async function handleSave() {
    if (!name.trim()) return;
    await addFolder(name.trim(), selectedColor, '');
    impactOnSave();
    router.back();
  }

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pt-3">
          {/* Name input */}
            <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 8 }}>
              name
            </ThemeText>
            <CountedInput
              value={name}
              onChangeText={(t) => setName(t.slice(0, 30))}
              placeholder="folder name..."
              maxLength={30}
              autoFocus
              style={{ fontSize: 28, lineHeight: 38, letterSpacing: 0.1 }}
            />

            {/* Color picker */}
            <View className="mt-6">
              <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
                color
              </ThemeText>
              <ColorSwatchPicker selectedColor={selectedColor} onSelect={setSelectedColor} />
            </View>
          </View>

          {/* Save button */}
          <View className="px-4 pt-8">
            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim()}
              className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
              style={{ opacity: name.trim() ? 1 : 0.4 }}
              activeOpacity={0.85}
            >
              <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>create folder</ThemeText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
  );
}
