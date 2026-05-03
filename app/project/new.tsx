import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback } from '@/hooks';
import { PageHeader, ThemeText, ColorSwatchPicker, CountedInput } from '@/components/ui';
import { PROJECT_COLORS, BUTTON_TEXT_ON_ACCENT } from '@/constants';

export default function NewProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { addProject } = useStore();
  const { impactOnSave } = useHapticFeedback();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  async function handleSave() {
    if (!name.trim()) return;
    await addProject(name.trim(), selectedColor, '');
    impactOnSave();
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
          {/* Name input */}
            <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 8 }}>
              name
            </ThemeText>
            <CountedInput
              value={name}
              onChangeText={(t) => setName(t.slice(0, 30))}
              placeholder="project name..."
              maxLength={30}
              autoFocus
              style={{ fontSize: 28, lineHeight: 38, letterSpacing: 0.1 }}
            />

            {/* Color picker */}
            <View style={{ marginTop: 24 }}>
              <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
                color
              </ThemeText>
              <ColorSwatchPicker selectedColor={selectedColor} onSelect={setSelectedColor} />
            </View>
          </View>

          {/* Save button */}
          <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim()}
              style={{
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.amber,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: name.trim() ? 1 : 0.4,
              }}
              activeOpacity={0.85}
            >
              <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>create project</ThemeText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
  );
}
