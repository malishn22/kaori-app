import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useAnimatedPopup, useConfirmAction, useActiveFolders } from '@/hooks';
import { ThemeText, ColorDot, Chip, PageHeader, MenuRow, HeaderText, CalendarPicker, PopupMenu, FolderChipSelector } from '@/components/ui';
import { BUTTON_TEXT_ON_ACCENT, DELETE_COLOR } from '@/constants';
import { formatDueDate, isOverdue, isDueSoon, getDateChipOptions, isSameDay } from '@/utils';
import { computeDisplayStrings } from '@/utils/time';

export default function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, updateTask, deleteTask, toggleTask } = useStore();
  const folders = useActiveFolders();
  const task = tasks.find(t => t.id === id);
  const folder = task?.folder ? folders.find(f => f.id === task.folder) : undefined;

  const { impactOnSave, impact, notificationWarning } = useHapticFeedback();

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDueDate, setDraftDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isCustomDraftDate = draftDueDate !== null && !getDateChipOptions().some(opt => isSameDay(draftDueDate, opt.date));

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

  const { anim: menuAnim, opacity: popupOpacity, open: openPopup, close: closePopup } = useAnimatedPopup();

  if (!task) return null;

  const { date, time } = computeDisplayStrings(task.createdAt);

  const dueDateColor = task.dueDate
    ? task.done ? colors.ink4
      : isOverdue(task.dueDate) ? DELETE_COLOR
      : isDueSoon(task.dueDate) ? colors.amber
      : colors.ink4
    : undefined;

  function startEditing() {
    setDraftTitle(task!.title);
    setDraftDueDate(task!.dueDate ? new Date(task!.dueDate) : null);
    setShowDatePicker(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setShowDatePicker(false);
  }

  async function handleSave() {
    if (!draftTitle.trim()) return;
    await updateTask(task!.id, {
      title: draftTitle.trim(),
      dueDate: draftDueDate ? draftDueDate.toISOString() : null,
    });
    impactOnSave();
    setEditing(false);
    setShowDatePicker(false);
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
      // Was open, now completed + archived — go back
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

  const popupTop = insets.top + 16 + 52 + 8;

  return (
    <View className="flex-1 bg-theme-bg">
        <PageHeader
          onBack={handleBack}
          editButton={{ onPress: () => editing ? cancelEdit() : startEditing(), active: editing }}
          moreButton={{ onPress: openMenu }}
        />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pt-6">
            {/* Folder pill */}
            {folder && (
              <View className="self-start mb-4">
                <Chip color={folder.color} dot dotSize={7}>
                  <ThemeText variant="chip" size={12} color="cream">{folder.name}</ThemeText>
                </Chip>
              </View>
            )}

            {/* Done badge */}
            {task.done && !editing && (
              <View className="self-start mb-3 px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${colors.amber}22` }}>
                <ThemeText variant="meta" size={11} color="amber">completed</ThemeText>
              </View>
            )}

            {/* Title */}
            {editing ? (
              <TextInput
                style={{
                  fontFamily: FONT.kalam,
                  fontSize: 26,
                  color: colors.ink,
                  lineHeight: 36,
                  letterSpacing: 0.1,
                }}
                value={draftTitle}
                onChangeText={setDraftTitle}
                multiline
                autoFocus
                selectionColor={colors.amber}
                cursorColor={colors.amber}
              />
            ) : (
              <HeaderText
                size={26}
                lineHeight={36}
                style={{
                  textDecorationLine: task.done ? 'line-through' : 'none',
                  opacity: task.done ? 0.5 : 1,
                }}
              >
                {task.title}
              </HeaderText>
            )}

            {/* Due date (edit mode) */}
            {editing && (
              <View className="mt-5">
                <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
                  due date
                </ThemeText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-1.5">
                    <Chip active={draftDueDate === null} onPress={() => { setDraftDueDate(null); setShowDatePicker(false); }}>
                      <ThemeText variant="chip" size={13} color={draftDueDate === null ? 'ink' : 'ink2'}>none</ThemeText>
                    </Chip>
                    <Chip active={isCustomDraftDate} onPress={() => setShowDatePicker(true)}>
                      <ThemeText variant="chip" size={13} color={isCustomDraftDate ? 'ink' : 'ink2'}>
                        {isCustomDraftDate ? formatDueDate(draftDueDate!.toISOString()) : '+'}
                      </ThemeText>
                    </Chip>
                    {getDateChipOptions().map(opt => {
                      const isActive = draftDueDate !== null && isSameDay(draftDueDate, opt.date);
                      return (
                        <Chip key={opt.label} active={isActive} onPress={() => { setDraftDueDate(opt.date); setShowDatePicker(false); }}>
                          <ThemeText variant="chip" size={13} color={isActive ? 'ink' : 'ink2'}>{opt.label}</ThemeText>
                        </Chip>
                      );
                    })}
                  </View>
                </ScrollView>

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
                {task.dueDate && <ThemeText variant="meta" style={{ opacity: 0.4 }}>·</ThemeText>}
                <ThemeText variant="meta">
                  {date === 'today' ? 'today' : date}, {time}
                </ThemeText>
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
                <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>save</ThemeText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Popup menu */}
        <PopupMenu visible={menuOpen} onClose={() => closeMenu()} anim={menuAnim} opacity={popupOpacity} anchor="top-right" top={popupTop}>
          <MenuRow
            label={task.done ? 'mark open' : 'mark done'}
            right={task.done ? <ThemeText variant="meta" color="amber">done</ThemeText> : undefined}
            onPress={handleToggleDone}
          />

          <MenuRow
            label="move to folder"
            right={folder
              ? <View className="flex-row items-center gap-[5px]">
                  <ColorDot color={folder.color} size={6} />
                  <ThemeText variant="meta">{folder.name}</ThemeText>
                </View>
              : <ThemeText variant="meta" size={13} color="ink4">›</ThemeText>
            }
            onPress={() => setMovingFolder(v => !v)}
          />

          {movingFolder && (
            <View className="px-3 py-2.5 border-b border-theme-line">
              <FolderChipSelector folders={folders} selected={task.folder} onSelect={handleMoveFolder} />
            </View>
          )}

          <MenuRow
            label={task.pinned ? 'unpin' : 'pin'}
            right={task.pinned ? <ThemeText variant="meta" color="amber">pinned</ThemeText> : undefined}
            onPress={handlePin}
          />

          <MenuRow label="share" onPress={handleShare} />

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
      </View>
  );
}
