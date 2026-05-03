import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useActiveFolders } from '@/hooks';
import { PageHeader, ThemeText, FolderChipSelector } from '@/components/ui';
import { BUTTON_TEXT_ON_ACCENT } from '@/constants';

export default function NewNoteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const { addNote } = useStore();
  const folders = useActiveFolders();
  const { impactOnSave } = useHapticFeedback();

  const [text, setText] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderId ?? null);

  async function handleSave() {
    if (!text.trim()) return;
    await addNote(text.trim(), selectedFolder);
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
          {/* Text input */}
          <TextInput
            style={{
              fontFamily: FONT.kalam,
              fontSize: 26,
              color: colors.ink,
              lineHeight: 36,
              letterSpacing: 0.1,
              textAlignVertical: 'top',
              minHeight: 160,
            }}
            value={text}
            onChangeText={setText}
            placeholder="what's on your mind..."
            placeholderTextColor={colors.ink4}
            multiline
            autoFocus
            selectionColor={colors.amber}
            cursorColor={colors.amber}
          />

          {/* Folder selector */}
          <FolderChipSelector folders={folders} selected={selectedFolder} onSelect={setSelectedFolder} label="folder" />
        </View>

        {/* Save button */}
        <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!text.trim()}
            style={{
              height: 52,
              borderRadius: 16,
              backgroundColor: colors.amber,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: text.trim() ? 1 : 0.4,
            }}
            activeOpacity={0.85}
          >
            <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>save note</ThemeText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
