import React, { useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useActiveFolders, useSpeechToText } from '@/hooks';
import {
  PageHeader,
  ThemeText,
  Chip,
  CalendarPicker,
  ReminderPicker,
  FolderChipSelector,
  FormatToolbar,
  EditorScreen,
  TextContent,
  type TextContentHandle,
} from '@/components/ui';
import { fromEditableText } from '@/utils/links';
import { BUTTON_TEXT_ON_ACCENT } from '@/constants';
import { getDateChipOptions, isSameDay, formatDueDate } from '@/utils';

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatReminderDate(date: Date): string {
  const month = MONTH_SHORT[date.getMonth()];
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMin = String(minutes).padStart(2, '0');
  return `${month} ${day} · ${displayHour}:${displayMin} ${ampm}`;
}

export default function NewTaskScreen() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const { addTask } = useStore();
  const folders = useActiveFolders();
  const { impactOnSave } = useHapticFeedback();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderId ?? null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftReminderAt, setDraftReminderAt] = useState<Date | null>(null);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const editorRef = useRef<TextContentHandle>(null);

  const { isListening, isAvailable, start, stop } = useSpeechToText({
    onTranscript: (transcript) => editorRef.current?.updateDictation(transcript),
  });

  function handleMic() {
    if (isListening) {
      stop();
    } else {
      editorRef.current?.beginDictation();
      start();
    }
  }

  const isCustomDate =
    dueDate !== null && !getDateChipOptions().some((opt) => isSameDay(dueDate, opt.date));

  async function handleSave() {
    if (!title.trim()) return;
    const { text, links } = fromEditableText(title.trim());
    await addTask(
      text,
      dueDate ? dueDate.toISOString() : null,
      selectedFolder,
      draftReminderAt ? draftReminderAt.toISOString() : null,
      links,
    );
    impactOnSave();
    router.back();
  }

  function handleClearDueDate() {
    setDueDate(null);
    setDraftReminderAt(null);
    setShowDatePicker(false);
  }

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader onBack={() => router.back()} />
      <EditorScreen
        toolbar={
          <FormatToolbar
            onCheckbox={() => editorRef.current?.insertCheckbox()}
            onDotted={() => editorRef.current?.insertDotted()}
            onNumbered={() => editorRef.current?.insertNumbered()}
            onStrikethrough={() => editorRef.current?.wrapStrikethrough()}
            onMic={handleMic}
            isListening={isListening}
            isMicAvailable={isAvailable}
          />
        }
      >
        <View className="px-6 pt-3">
          <TextContent
            ref={editorRef}
            text=""
            links={{}}
            editing
            draft={title}
            onDraftChange={setTitle}
            onCheckboxToggle={() => {}}
            placeholder="task title"
          />

          <View className="mt-6">
            <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
              due date
            </ThemeText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1.5">
                <Chip active={dueDate === null} onPress={handleClearDueDate}>
                  <ThemeText variant="chip" size={13} color={dueDate === null ? 'ink' : 'ink2'}>
                    none
                  </ThemeText>
                </Chip>
                <Chip active={isCustomDate} onPress={() => setShowDatePicker(true)}>
                  <ThemeText variant="chip" size={13} color={isCustomDate ? 'ink' : 'ink2'}>
                    {isCustomDate ? formatDueDate(dueDate!.toISOString()) : '+'}
                  </ThemeText>
                </Chip>
                {getDateChipOptions().map((opt) => {
                  const isActive = dueDate !== null && isSameDay(dueDate, opt.date);
                  return (
                    <Chip
                      key={opt.label}
                      active={isActive}
                      onPress={() => {
                        setDueDate(opt.date);
                        setShowDatePicker(false);
                      }}
                    >
                      <ThemeText variant="chip" size={13} color={isActive ? 'ink' : 'ink2'}>
                        {opt.label}
                      </ThemeText>
                    </Chip>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {dueDate !== null && (
            <View className="mt-4">
              <ThemeText
                variant="caption"
                size={11}
                letterSpacing={0.4}
                style={{ marginBottom: 10 }}
              >
                reminder
              </ThemeText>
              <View className="flex-row gap-1.5">
                <Chip active={draftReminderAt !== null} onPress={() => setShowReminderPicker(true)}>
                  <ThemeText
                    variant="chip"
                    size={13}
                    color={draftReminderAt !== null ? 'ink' : 'ink2'}
                  >
                    {draftReminderAt !== null
                      ? formatReminderDate(draftReminderAt)
                      : 'set reminder'}
                  </ThemeText>
                </Chip>
                {draftReminderAt !== null && (
                  <Chip onPress={() => setDraftReminderAt(null)}>
                    <ThemeText variant="chip" size={13} color="ink2">
                      clear
                    </ThemeText>
                  </Chip>
                )}
              </View>
            </View>
          )}

          <FolderChipSelector
            folders={folders}
            selected={selectedFolder}
            onSelect={setSelectedFolder}
            label="folder"
          />
        </View>

        <View className="px-4 pt-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={!title.trim()}
            className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
            style={{ opacity: title.trim() ? 1 : 0.4 }}
            activeOpacity={0.85}
          >
            <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>
              save task
            </ThemeText>
          </TouchableOpacity>
        </View>
      </EditorScreen>

      <CalendarPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={dueDate}
        onChange={setDueDate}
        minimumDate={new Date()}
      />

      {dueDate !== null && (
        <ReminderPicker
          visible={showReminderPicker}
          onClose={() => setShowReminderPicker(false)}
          value={draftReminderAt}
          onChange={setDraftReminderAt}
          baseDate={dueDate}
        />
      )}
    </View>
  );
}
