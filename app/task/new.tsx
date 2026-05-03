import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback } from '@/hooks';
import { PageHeader, ThemeText, Chip, ColorDot, CalendarPicker } from '@/components/ui';
import { BUTTON_TEXT_ON_ACCENT } from '@/constants';
import { getDateChipOptions, isSameDay, formatDueDate } from '@/utils';

export default function NewTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const { projects: allProjects, addTask } = useStore();
  const projects = allProjects.filter(p => !p.archived);
  const { impactOnSave } = useHapticFeedback();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId ?? null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isCustomDate = dueDate !== null && !getDateChipOptions().some(opt => isSameDay(dueDate, opt.date));

  async function handleSave() {
    if (!title.trim()) return;
    await addTask(
      title.trim(),
      body.trim(),
      dueDate ? dueDate.toISOString() : null,
      selectedProject,
    );
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
          {/* Title */}
            <TextInput
              style={{
                fontFamily: FONT.kalam,
                fontSize: 28,
                color: colors.ink,
                lineHeight: 38,
                letterSpacing: 0.1,
              }}
              value={title}
              onChangeText={setTitle}
              placeholder="task title"
              placeholderTextColor={colors.ink4}
              multiline
              autoFocus
              selectionColor={colors.amber}
              cursorColor={colors.amber}
            />

            {/* Body */}
            <TextInput
              style={{
                fontFamily: FONT.kalam,
                fontSize: 15,
                color: colors.ink2,
                lineHeight: 22,
                marginTop: 12,
                minHeight: 44,
              }}
              value={body}
              onChangeText={setBody}
              placeholder="add details..."
              placeholderTextColor={colors.ink4}
              multiline
              selectionColor={colors.amber}
              cursorColor={colors.amber}
            />

            {/* Due date */}
            <View style={{ marginTop: 24 }}>
              <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
                due date
              </ThemeText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
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

            {/* Project selector */}
            <View style={{ marginTop: 24 }}>
              <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
                project
              </ThemeText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Chip active={selectedProject === null} onPress={() => setSelectedProject(null)}>
                    <ThemeText variant="chip" size={13} color={selectedProject === null ? 'ink' : 'ink2'}>none</ThemeText>
                  </Chip>
                  {projects.map(p => (
                    <Chip key={p.id} color={p.color} active={selectedProject === p.id} dot dotSize={5} onPress={() => setSelectedProject(p.id)}>
                      <ThemeText variant="chip" size={13} color={selectedProject === p.id ? p.color : 'ink2'}>{p.name}</ThemeText>
                    </Chip>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Save button */}
          <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!title.trim()}
              style={{
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.amber,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: title.trim() ? 1 : 0.4,
              }}
              activeOpacity={0.85}
            >
              <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>save task</ThemeText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <CalendarPicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          value={dueDate}
          onChange={setDueDate}
          minimumDate={new Date()}
        />
      </View>
  );
}
