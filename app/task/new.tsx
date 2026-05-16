import React, { useState, useRef } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useActiveFolders } from '@/hooks';
import { PageHeader, ThemeText, Chip, CalendarPicker, FolderChipSelector, FormatToolbar } from '@/components/ui';
import { insertCheckboxAtCursor, wrapStrikethrough } from '@/utils/noteFormat';
import { BUTTON_TEXT_ON_ACCENT } from '@/constants';
import { getDateChipOptions, isSameDay, formatDueDate } from '@/utils';

export default function NewTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const { addTask } = useStore();
  const folders = useActiveFolders();
  const { impactOnSave } = useHapticFeedback();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderId ?? null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const selectionRef = useRef({ start: 0, end: 0 });

  const isCustomDate = dueDate !== null && !getDateChipOptions().some(opt => isSameDay(dueDate, opt.date));

  async function handleSave() {
    if (!title.trim()) return;
    await addTask(
      title.trim(),
      dueDate ? dueDate.toISOString() : null,
      selectedFolder,
    );
    impactOnSave();
    router.back();
  }

  function handleInsertCheckbox() {
    const { newText } = insertCheckboxAtCursor(title, selectionRef.current.start);
    setTitle(newText);
  }

  function handleInsertStrikethrough() {
    const { start, end } = selectionRef.current;
    const { newText } = wrapStrikethrough(title, start, end);
    setTitle(newText);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-theme-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      <PageHeader onBack={() => router.back()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <View className="px-6 pt-3">
          {/* Title */}
          <TextInput
            style={{
              fontFamily: FONT.kalam,
              fontSize: 20,
              color: colors.ink,
              lineHeight: 28,
              letterSpacing: 0.1,
            }}
            value={title}
            onChangeText={setTitle}
            onSelectionChange={e => { selectionRef.current = e.nativeEvent.selection; }}
            placeholder="task title"
            placeholderTextColor={colors.ink4}
            multiline
            autoFocus
            selectionColor={colors.amber}
            cursorColor={colors.amber}
          />

          {/* Due date */}
          <View className="mt-6">
            <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
              due date
            </ThemeText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1.5">
                <Chip active={dueDate === null} onPress={() => { setDueDate(null); setShowDatePicker(false); }}>
                  <ThemeText variant="chip" size={13} color={dueDate === null ? 'ink' : 'ink2'}>none</ThemeText>
                </Chip>
                <Chip active={isCustomDate} onPress={() => setShowDatePicker(true)}>
                  <ThemeText variant="chip" size={13} color={isCustomDate ? 'ink' : 'ink2'}>
                    {isCustomDate ? formatDueDate(dueDate!.toISOString()) : '+'}
                  </ThemeText>
                </Chip>
                {getDateChipOptions().map(opt => {
                  const isActive = dueDate !== null && isSameDay(dueDate, opt.date);
                  return (
                    <Chip key={opt.label} active={isActive} onPress={() => { setDueDate(opt.date); setShowDatePicker(false); }}>
                      <ThemeText variant="chip" size={13} color={isActive ? 'ink' : 'ink2'}>{opt.label}</ThemeText>
                    </Chip>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Folder selector */}
          <FolderChipSelector folders={folders} selected={selectedFolder} onSelect={setSelectedFolder} label="folder" />
        </View>

        {/* Save button */}
        <View className="px-4 pt-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={!title.trim()}
            className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
            style={{ opacity: title.trim() ? 1 : 0.4 }}
            activeOpacity={0.85}
          >
            <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>save task</ThemeText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: Math.min(insets.bottom, 8) }}>
        <FormatToolbar onCheckbox={handleInsertCheckbox} onStrikethrough={handleInsertStrikethrough} />
      </View>

      <CalendarPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={dueDate}
        onChange={setDueDate}
        minimumDate={new Date()}
      />
    </KeyboardAvoidingView>
  );
}
