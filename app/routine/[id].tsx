import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useSettings } from '@/providers/SettingsProvider';
import {
  useHapticFeedback,
  useAnimatedPopup,
  useConfirmAction,
  useInlineEdit,
  useSpeechToText,
} from '@/hooks';
import {
  ThemeText,
  Chip,
  PageHeader,
  MenuRow,
  ReminderPicker,
  PopupMenu,
  WeekdaySelector,
  FormatToolbar,
  EditorScreen,
  TextContent,
  type TextContentHandle,
} from '@/components/ui';
import { toEditableText, fromEditableText } from '@/utils/links';
import { BUTTON_TEXT_ON_ACCENT, DELETE_COLOR } from '@/constants';
import { computeDisplayStrings, formatTimeOfDay, dateKey } from '@/utils/time';
import { cancelRoutineReminders } from '@/utils/notifications';

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

export default function RoutineDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routines, updateRoutine, deleteRoutine, toggleRoutineDone } = useStore();
  const routine = routines.find((r) => r.id === id);

  const { settings } = useSettings();
  const { impactOnSave, impact, notificationWarning } = useHapticFeedback();

  const editorRef = useRef<TextContentHandle>(null);

  const {
    editing,
    draft: draftTitle,
    setDraft: setDraftTitle,
    startEditing: startTitleEditing,
    cancelEdit: cancelTitleEdit,
  } = useInlineEdit({
    initialValue: routine?.title ?? '',
    onSave: async () => {},
  });
  const [draftDays, setDraftDays] = useState<number[]>([]);
  const [draftReminderTime, setDraftReminderTime] = useState<string | null>(null);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

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

  const confirmDelete = useConfirmAction({
    onConfirm: async () => {
      await deleteRoutine(routine!.id);
      setMenuOpen(false);
      router.back();
    },
    onHaptic: notificationWarning,
  });

  const [menuOpen, setMenuOpen] = useState(false);

  const {
    anim: menuAnim,
    opacity: popupOpacity,
    open: openPopup,
    close: closePopup,
  } = useAnimatedPopup();

  if (!routine) return null;

  const { date, time } = computeDisplayStrings(routine.createdAt);
  const doneToday = !!routine.completions[dateKey()];
  const canSave = draftTitle.trim().length > 0 && draftDays.length > 0;

  function startEditing() {
    setDraftDays(routine!.daysOfWeek);
    setDraftReminderTime(routine!.reminderTime);
    setShowReminderPicker(false);
    startTitleEditing(toEditableText(routine!.title, routine!.links ?? {}));
  }

  function cancelEdit() {
    cancelTitleEdit();
    setShowReminderPicker(false);
  }

  function toggleDraftDay(day: number) {
    setDraftDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  async function handleSave() {
    if (!canSave) return;
    const { text, links } = fromEditableText(draftTitle.trim());
    await updateRoutine(routine!.id, {
      title: text,
      links,
      daysOfWeek: draftDays,
      reminderTime: draftReminderTime,
    });
    impactOnSave();
    cancelTitleEdit();
    setShowReminderPicker(false);
  }

  function openMenu() {
    confirmDelete.reset();
    setMenuOpen(true);
    openPopup();
  }

  function closeMenu(cb?: () => void) {
    closePopup(() => {
      setMenuOpen(false);
      cb?.();
    });
  }

  async function handleToggleDone() {
    await toggleRoutineDone(routine!.id);
    impact();
  }

  async function handleTogglePause() {
    await updateRoutine(routine!.id, { active: !routine!.active });
    impact();
    closeMenu();
  }

  async function handlePin() {
    await updateRoutine(routine!.id, { pinned: !routine!.pinned });
    impact();
    closeMenu();
  }

  async function handleShare() {
    closeMenu(async () => {
      await Share.share({ message: routine!.title });
    });
  }

  function handleBack() {
    if (editing) {
      cancelEdit();
    } else {
      router.back();
    }
  }

  function handleCheckboxToggle(next: string) {
    updateRoutine(routine!.id, { title: next });
    impact();
  }

  const popupTop = insets.top + 16 + 52 + 8;

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader
        onBack={handleBack}
        editButton={{ onPress: () => (editing ? cancelEdit() : startEditing()), active: editing }}
        moreButton={{ onPress: openMenu }}
      />

      <EditorScreen
        toolbarVisible={editing}
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
        <View className="px-6 pt-6">
          {/* Paused badge */}
          {!routine.active && !editing && (
            <View
              className="self-start mb-3 px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: `${colors.ink4}22` }}
            >
              <ThemeText variant="meta" size={11} color="ink3">
                paused
              </ThemeText>
            </View>
          )}

          <TextContent
            ref={editorRef}
            text={routine.title}
            links={routine.links ?? {}}
            editing={editing}
            draft={draftTitle}
            onDraftChange={setDraftTitle}
            onCheckboxToggle={handleCheckboxToggle}
          />

          {/* Repeats + reminder (edit mode) */}
          {editing && (
            <>
              <WeekdaySelector
                selected={draftDays}
                onToggle={toggleDraftDay}
                onSetAll={setDraftDays}
                label="repeats"
              />
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
                  <Chip
                    active={draftReminderTime !== null}
                    onPress={() => setShowReminderPicker(true)}
                  >
                    <ThemeText
                      variant="chip"
                      size={13}
                      color={draftReminderTime !== null ? 'ink' : 'ink2'}
                    >
                      {draftReminderTime !== null ? formatTimeOfDay(draftReminderTime) : 'set time'}
                    </ThemeText>
                  </Chip>
                </View>
              </View>
            </>
          )}

          {/* Meta (display mode) */}
          {!editing && (
            <View className="flex-row flex-wrap gap-3 mt-[18px] items-center">
              {routine.reminderTime && (
                <>
                  <ThemeText variant="meta" color="amber">
                    {formatTimeOfDay(routine.reminderTime)}
                  </ThemeText>
                  <ThemeText variant="meta" style={{ opacity: 0.4 }}>
                    ·
                  </ThemeText>
                </>
              )}
              <ThemeText variant="meta">
                {date === 'today' ? 'today' : date}, {time}
              </ThemeText>
            </View>
          )}

          {/* Done today toggle (display mode) */}
          {!editing && routine.active && (
            <TouchableOpacity
              onPress={handleToggleDone}
              activeOpacity={0.7}
              className="flex-row items-center gap-2.5 self-start mt-5 px-3.5 py-2.5 rounded-2xl border-[1.5px]"
              style={{
                borderColor: doneToday ? colors.amber : colors.line2,
                backgroundColor: doneToday ? `${colors.amber}14` : 'transparent',
              }}
            >
              <View
                className="size-5 items-center justify-center rounded-full border-[1.5px]"
                style={{
                  borderColor: doneToday ? colors.amber : colors.line2,
                  backgroundColor: doneToday ? colors.amber : 'transparent',
                }}
              />
              <ThemeText variant="label" color={doneToday ? 'amber' : 'ink2'}>
                {doneToday ? 'done today' : 'mark done today'}
              </ThemeText>
            </TouchableOpacity>
          )}
        </View>

        {/* Save bar */}
        {editing && (
          <View className="px-4 pt-6">
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
              style={{ opacity: canSave ? 1 : 0.4 }}
              activeOpacity={0.85}
            >
              <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>
                save
              </ThemeText>
            </TouchableOpacity>
          </View>
        )}
      </EditorScreen>

      {/* Popup menu */}
      <PopupMenu
        visible={menuOpen}
        onClose={() => closeMenu()}
        anim={menuAnim}
        opacity={popupOpacity}
        anchor="top-right"
        top={popupTop}
      >
        <MenuRow
          label={routine.active ? 'pause routine' : 'resume routine'}
          right={
            !routine.active ? (
              <ThemeText variant="meta" color="ink3">
                paused
              </ThemeText>
            ) : undefined
          }
          onPress={handleTogglePause}
        />

        <MenuRow
          label={routine.pinned ? 'unpin' : 'pin'}
          right={
            routine.pinned ? (
              <ThemeText variant="meta" color="amber">
                pinned
              </ThemeText>
            ) : undefined
          }
          onPress={handlePin}
        />

        {routine.active && settings.notificationsEnabled && (
          <MenuRow
            label="mute reminder"
            onPress={() => {
              cancelRoutineReminders(routine.id);
              impact();
              closeMenu();
            }}
          />
        )}

        <MenuRow label="share" onPress={handleShare} />

        <MenuRow
          label={confirmDelete.needsConfirm ? 'tap again to confirm' : 'delete'}
          labelColor={DELETE_COLOR}
          onPress={confirmDelete.handlePress}
          borderBottom={false}
        />
      </PopupMenu>

      <ReminderPicker
        visible={showReminderPicker}
        onClose={() => setShowReminderPicker(false)}
        value={timeStringToDate(draftReminderTime, new Date())}
        onChange={(d) => setDraftReminderTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`)}
        baseDate={new Date()}
      />
    </View>
  );
}
