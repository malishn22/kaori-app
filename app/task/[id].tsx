import React, { useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useSettings } from '@/providers/SettingsProvider';
import {
  useHapticFeedback,
  useAnimatedPopup,
  useConfirmAction,
  useActiveFolders,
  useInlineEdit,
} from '@/hooks';
import {
  ThemeText,
  ColorDot,
  Chip,
  PageHeader,
  MenuRow,
  CalendarPicker,
  ReminderPicker,
  PopupMenu,
  FolderChipSelector,
  FormatToolbar,
  EditorScreen,
  TextContent,
  type TextContentHandle,
} from '@/components/ui';
import { toEditableText, fromEditableText } from '@/utils/links';
import { BUTTON_TEXT_ON_ACCENT, DELETE_COLOR } from '@/constants';
import { formatDueDate, isOverdue, isDueSoon, getDateChipOptions, isSameDay } from '@/utils';
import { computeDisplayStrings } from '@/utils/time';
import { cancelTaskReminder } from '@/utils/notifications';

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

export default function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, updateTask, deleteTask, toggleTask, convertTaskToNote } = useStore();
  const folders = useActiveFolders();
  const task = tasks.find((t) => t.id === id);
  const folder = task?.folder ? folders.find((f) => f.id === task.folder) : undefined;

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
    initialValue: task?.title ?? '',
    onSave: async () => {},
  });
  const [draftDueDate, setDraftDueDate] = useState<Date | null>(null);
  const [draftReminderAt, setDraftReminderAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const isCustomDraftDate =
    draftDueDate !== null && !getDateChipOptions().some((opt) => isSameDay(draftDueDate, opt.date));

  const confirmDelete = useConfirmAction({
    onConfirm: async () => {
      await deleteTask(task!.id);
      setMenuOpen(false);
      router.back();
    },
    onHaptic: notificationWarning,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [movingFolder, setMovingFolder] = useState(false);

  const {
    anim: menuAnim,
    opacity: popupOpacity,
    open: openPopup,
    close: closePopup,
  } = useAnimatedPopup();

  if (!task) return null;

  const { date, time } = computeDisplayStrings(task.createdAt);

  const dueDateColor = task.dueDate
    ? task.done
      ? colors.ink4
      : isOverdue(task.dueDate)
        ? DELETE_COLOR
        : isDueSoon(task.dueDate)
          ? colors.amber
          : colors.ink4
    : undefined;

  function startEditing() {
    setDraftDueDate(task!.dueDate ? new Date(task!.dueDate) : null);
    setDraftReminderAt(task!.reminderAt ? new Date(task!.reminderAt) : null);
    setShowDatePicker(false);
    setShowReminderPicker(false);
    startTitleEditing(toEditableText(task!.title, task!.links ?? {}));
  }

  function cancelEdit() {
    cancelTitleEdit();
    setShowDatePicker(false);
    setShowReminderPicker(false);
  }

  async function handleSave() {
    if (!draftTitle.trim()) return;
    const { text, links } = fromEditableText(draftTitle.trim());
    await updateTask(task!.id, {
      title: text,
      links,
      dueDate: draftDueDate ? draftDueDate.toISOString() : null,
      reminderAt: draftReminderAt ? draftReminderAt.toISOString() : null,
    });
    impactOnSave();
    cancelTitleEdit();
    setShowDatePicker(false);
    setShowReminderPicker(false);
  }

  function openMenu() {
    confirmDelete.reset();
    setMovingFolder(false);
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
    await toggleTask(task!.id);
    impact();
    if (!task!.done) {
      setMenuOpen(false);
      router.back();
    } else {
      closeMenu();
    }
  }

  async function handlePin() {
    await updateTask(task!.id, { pinned: !task!.pinned });
    impact();
    closeMenu();
  }

  async function handleMoveFolder(folderId: string | null) {
    await updateTask(task!.id, { folder: folderId });
    impact();
    closeMenu();
  }

  async function handleShare() {
    closeMenu(async () => {
      await Share.share({ message: task!.title });
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
    updateTask(task!.id, { title: next });
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
            onStrikethrough={() => editorRef.current?.wrapStrikethrough()}
          />
        }
      >
        <View className="px-6 pt-6">
          {/* Folder pill */}
          {folder && (
            <View className="self-start mb-4">
              <Chip color={folder.color} dot dotSize={7}>
                <ThemeText variant="chip" size={12} color="cream">
                  {folder.name}
                </ThemeText>
              </Chip>
            </View>
          )}

          {/* Done badge */}
          {task.done && !editing && (
            <View
              className="self-start mb-3 px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: `${colors.amber}22` }}
            >
              <ThemeText variant="meta" size={11} color="amber">
                completed
              </ThemeText>
            </View>
          )}

          <TextContent
            ref={editorRef}
            text={task.title}
            links={task.links ?? {}}
            editing={editing}
            draft={draftTitle}
            onDraftChange={setDraftTitle}
            onCheckboxToggle={handleCheckboxToggle}
            textStyle={task.done ? { textDecorationLine: 'line-through', opacity: 0.5 } : undefined}
          />

          {/* Due date (edit mode) */}
          {editing && (
            <View className="mt-5">
              <ThemeText
                variant="caption"
                size={11}
                letterSpacing={0.4}
                style={{ marginBottom: 10 }}
              >
                due date
              </ThemeText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-1.5">
                  <Chip
                    active={draftDueDate === null}
                    onPress={() => {
                      setDraftDueDate(null);
                      setShowDatePicker(false);
                    }}
                  >
                    <ThemeText
                      variant="chip"
                      size={13}
                      color={draftDueDate === null ? 'ink' : 'ink2'}
                    >
                      none
                    </ThemeText>
                  </Chip>
                  <Chip active={isCustomDraftDate} onPress={() => setShowDatePicker(true)}>
                    <ThemeText variant="chip" size={13} color={isCustomDraftDate ? 'ink' : 'ink2'}>
                      {isCustomDraftDate ? formatDueDate(draftDueDate!.toISOString()) : '+'}
                    </ThemeText>
                  </Chip>
                  {getDateChipOptions().map((opt) => {
                    const isActive = draftDueDate !== null && isSameDay(draftDueDate, opt.date);
                    return (
                      <Chip
                        key={opt.label}
                        active={isActive}
                        onPress={() => {
                          setDraftDueDate(opt.date);
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
          )}

          {/* Reminder (edit mode, only when a due date is set) */}
          {editing && draftDueDate !== null && (
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

          {/* Meta (display mode) */}
          {!editing && (
            <View className="flex-row flex-wrap gap-3 mt-[18px] items-center">
              {task.dueDate && (
                <ThemeText variant="meta" color={dueDateColor}>
                  due {formatDueDate(task.dueDate)}
                </ThemeText>
              )}
              {task.dueDate && (
                <ThemeText variant="meta" style={{ opacity: 0.4 }}>
                  ·
                </ThemeText>
              )}
              <ThemeText variant="meta">
                {date === 'today' ? 'today' : date}, {time}
              </ThemeText>
              {task.reminderAt && settings.notificationsEnabled && !task.done && (
                <>
                  <ThemeText variant="meta" style={{ opacity: 0.4 }}>
                    ·
                  </ThemeText>
                  <ThemeText variant="meta" color="amber">
                    {formatReminderDate(new Date(task.reminderAt))}
                  </ThemeText>
                </>
              )}
            </View>
          )}
        </View>

        {/* Save bar */}
        {editing && (
          <View className="px-4 pt-6">
            <TouchableOpacity
              onPress={handleSave}
              disabled={!draftTitle.trim()}
              className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
              style={{ opacity: draftTitle.trim() ? 1 : 0.4 }}
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
          label={task.done ? 'mark open' : 'mark done'}
          right={
            task.done ? (
              <ThemeText variant="meta" color="amber">
                done
              </ThemeText>
            ) : undefined
          }
          onPress={handleToggleDone}
        />

        <MenuRow
          label="move to folder"
          right={
            folder ? (
              <View className="flex-row items-center gap-[5px]">
                <ColorDot color={folder.color} size={6} />
                <ThemeText variant="meta">{folder.name}</ThemeText>
              </View>
            ) : (
              <ThemeText variant="meta" size={13} color="ink4">
                ›
              </ThemeText>
            )
          }
          onPress={() => setMovingFolder((v) => !v)}
        />

        {movingFolder && (
          <View className="px-3 py-2.5 border-b border-theme-line">
            <FolderChipSelector
              folders={folders}
              selected={task.folder}
              onSelect={handleMoveFolder}
            />
          </View>
        )}

        <MenuRow
          label={task.pinned ? 'unpin' : 'pin'}
          right={
            task.pinned ? (
              <ThemeText variant="meta" color="amber">
                pinned
              </ThemeText>
            ) : undefined
          }
          onPress={handlePin}
        />

        {task.dueDate && settings.notificationsEnabled && (
          <MenuRow
            label="mute reminder"
            onPress={() => {
              cancelTaskReminder(task.id);
              impact();
              closeMenu();
            }}
          />
        )}

        <MenuRow label="share" onPress={handleShare} />

        <MenuRow
          label="convert to note"
          onPress={() => {
            const noteId = convertTaskToNote(task.id);
            setMenuOpen(false);
            if (noteId) router.replace(`/note/${noteId}`);
          }}
        />

        <MenuRow
          label={confirmDelete.needsConfirm ? 'tap again to confirm' : 'delete'}
          labelColor={DELETE_COLOR}
          onPress={confirmDelete.handlePress}
          borderBottom={false}
        />
      </PopupMenu>

      <CalendarPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={draftDueDate}
        onChange={setDraftDueDate}
        minimumDate={new Date()}
      />

      {draftDueDate !== null && (
        <ReminderPicker
          visible={showReminderPicker}
          onClose={() => setShowReminderPicker(false)}
          value={draftReminderAt}
          onChange={setDraftReminderAt}
          baseDate={draftDueDate}
        />
      )}
    </View>
  );
}
