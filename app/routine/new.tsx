import React, { useState, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useSpeechToText } from '@/hooks';
import {
  PageHeader,
  ThemeText,
  Chip,
  ReminderPicker,
  WeekdaySelector,
  FormatToolbar,
  EditorScreen,
  TextContent,
  type TextContentHandle,
} from '@/components/ui';
import { fromEditableText } from '@/utils/links';
import { BUTTON_TEXT_ON_ACCENT } from '@/constants';
import { formatTimeOfDay } from '@/utils/time';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function timeStringToDate(hhmm: string | null, baseDate: Date): Date | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

export default function NewRoutineScreen() {
  const router = useRouter();
  const { addRoutine } = useStore();
  const { impactOnSave } = useHapticFeedback();

  const [title, setTitle] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
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

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  const canSave = title.trim().length > 0 && daysOfWeek.length > 0;

  async function handleSave() {
    if (!canSave) return;
    const { text, links } = fromEditableText(title.trim());
    await addRoutine(text, daysOfWeek, reminderTime, links);
    impactOnSave();
    router.back();
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
            placeholder="routine title"
          />

          <WeekdaySelector
            selected={daysOfWeek}
            onToggle={toggleDay}
            onSetAll={setDaysOfWeek}
            label="repeats"
          />

          <View className="mt-4">
            <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
              reminder
            </ThemeText>
            <View className="flex-row gap-1.5">
              <Chip active={reminderTime !== null} onPress={() => setShowReminderPicker(true)}>
                <ThemeText variant="chip" size={13} color={reminderTime !== null ? 'ink' : 'ink2'}>
                  {reminderTime !== null ? formatTimeOfDay(reminderTime) : 'set time'}
                </ThemeText>
              </Chip>
              {reminderTime !== null && (
                <Chip onPress={() => setReminderTime(null)}>
                  <ThemeText variant="chip" size={13} color="ink2">
                    clear
                  </ThemeText>
                </Chip>
              )}
            </View>
          </View>
        </View>

        <View className="px-4 pt-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
            style={{ opacity: canSave ? 1 : 0.4 }}
            activeOpacity={0.85}
          >
            <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>
              save routine
            </ThemeText>
          </TouchableOpacity>
        </View>
      </EditorScreen>

      <ReminderPicker
        visible={showReminderPicker}
        onClose={() => setShowReminderPicker(false)}
        value={timeStringToDate(reminderTime, new Date())}
        onChange={(date) => setReminderTime(`${pad(date.getHours())}:${pad(date.getMinutes())}`)}
        baseDate={new Date()}
      />
    </View>
  );
}
