import React, { useState, useRef } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, InputAccessoryView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useActiveFolders } from '@/hooks';
import { PageHeader, ThemeText, FolderChipSelector, FormatToolbar } from '@/components/ui';
import { insertCheckboxAtCursor, wrapStrikethrough } from '@/utils/noteFormat';
import { BUTTON_TEXT_ON_ACCENT } from '@/constants';

const INPUT_ACCESSORY_ID = 'new-note-toolbar';

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
  const selectionRef = useRef({ start: 0, end: 0 });

  async function handleSave() {
    if (!text.trim()) return;
    await addNote(text.trim(), selectedFolder);
    impactOnSave();
    router.back();
  }

  function handleInsertCheckbox() {
    const { newText } = insertCheckboxAtCursor(text, selectionRef.current.start);
    setText(newText);
  }

  function handleInsertStrikethrough() {
    const { start, end } = selectionRef.current;
    const { newText } = wrapStrikethrough(text, start, end);
    setText(newText);
  }

  const toolbar = (
    <FormatToolbar onCheckbox={handleInsertCheckbox} onStrikethrough={handleInsertStrikethrough} />
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-theme-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <PageHeader onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pt-3">
          <TextInput
            style={{
              fontFamily: FONT.kalam,
              fontSize: 20,
              color: colors.ink,
              lineHeight: 28,
              letterSpacing: 0.1,
              textAlignVertical: 'top',
              minHeight: 160,
            }}
            value={text}
            onChangeText={setText}
            onSelectionChange={e => { selectionRef.current = e.nativeEvent.selection; }}
            placeholder="what's on your mind..."
            placeholderTextColor={colors.ink4}
            multiline
            autoFocus
            selectionColor={colors.amber}
            cursorColor={colors.amber}
            inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
          />

          <FolderChipSelector folders={folders} selected={selectedFolder} onSelect={setSelectedFolder} label="folder" />
        </View>

        <View className="px-4 pt-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={!text.trim()}
            className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
            style={{ opacity: text.trim() ? 1 : 0.4 }}
            activeOpacity={0.85}
          >
            <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>save note</ThemeText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          {toolbar}
        </InputAccessoryView>
      ) : (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          {toolbar}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
