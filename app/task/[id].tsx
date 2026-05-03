import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Share, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useAnimatedPopup, useConfirmAction } from '@/hooks';
import { GrainOverlay, ThemeText, ColorDot, Chip, PageHeader, MenuRow, HeaderText, CalendarPicker } from '@/components/ui';
import { POPUP_WIDTH, SHADOW_POPUP, BUTTON_TEXT_ON_ACCENT, DELETE_COLOR } from '@/constants';
import { formatDueDate, isOverdue, isDueSoon, getDateChipOptions, isSameDay } from '@/utils';
import { computeDisplayStrings } from '@/utils/time';

export default function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, projects: allProjects, updateTask, deleteTask, toggleTask } = useStore();
  const projects = allProjects.filter(p => !p.archived);
  const task = tasks.find(t => t.id === id);
  const proj = task?.project ? projects.find(p => p.id === task.project) : undefined;

  const { impactOnSave, impact, notificationWarning } = useHapticFeedback();

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
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
  const [movingProject, setMovingProject] = useState(false);
  const [popupHeight, setPopupHeight] = useState(0);

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
    setDraftBody(task!.body);
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
      body: draftBody.trim(),
      dueDate: draftDueDate ? draftDueDate.toISOString() : null,
    });
    impactOnSave();
    setEditing(false);
    setShowDatePicker(false);
  }

  function openMenu() {
    confirmDelete.reset();
    setMovingProject(false);
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

  async function handleMoveProject(projectId: string | null) {
    await updateTask(task!.id, { project: projectId });
    impact();
    closeMenu();
  }

  async function handleShare() {
    closeMenu(async () => {
      const message = task!.body ? `${task!.title}\n\n${task!.body}` : task!.title;
      await Share.share({ message });
    });
  }

  function handleBack() {
    if (editing) {
      cancelEdit();
    } else {
      router.back();
    }
  }

  const popupScale = menuAnim;
  const popupTop = insets.top + 16 + 52 + 8;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            {/* Project pill */}
            {proj && (
              <View style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
                <Chip color={proj.color} dot dotSize={7}>
                  <ThemeText variant="chip" size={12} color="cream">{proj.name}</ThemeText>
                </Chip>
              </View>
            )}

            {/* Done badge */}
            {task.done && !editing && (
              <View style={{
                alignSelf: 'flex-start',
                marginBottom: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: `${colors.amber}22`,
              }}>
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

            {/* Body */}
            {editing ? (
              <TextInput
                style={{
                  fontFamily: FONT.kalam,
                  fontSize: 15,
                  color: colors.ink2,
                  lineHeight: 22,
                  marginTop: 12,
                  minHeight: 44,
                }}
                value={draftBody}
                onChangeText={setDraftBody}
                placeholder="add details..."
                placeholderTextColor={colors.ink4}
                multiline
                selectionColor={colors.amber}
                cursorColor={colors.amber}
              />
            ) : task.body ? (
              <ThemeText variant="body" size={15} color="ink2" style={{ marginTop: 12, lineHeight: 22 }}>
                {task.body}
              </ThemeText>
            ) : null}

            {/* Due date (edit mode) */}
            {editing && (
              <View style={{ marginTop: 20 }}>
                <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 10 }}>
                  due date
                </ThemeText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18, alignItems: 'center' }}>
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
            <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!draftTitle.trim()}
                style={{
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: colors.amber,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: draftTitle.trim() ? 1 : 0.4,
                }}
                activeOpacity={0.85}
              >
                <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>save</ThemeText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Popup menu */}
        {menuOpen && (
          <>
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              onPress={() => closeMenu()}
            />

            <Animated.View
              onLayout={e => setPopupHeight(e.nativeEvent.layout.height)}
              style={{
                position: 'absolute',
                top: popupTop,
                right: 16,
                width: POPUP_WIDTH,
                backgroundColor: colors.paper,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.line2,
                overflow: 'hidden',
                ...SHADOW_POPUP,
                opacity: popupOpacity,
                transform: [
                  { translateX: POPUP_WIDTH / 2 },
                  { translateY: -popupHeight / 2 },
                  { scale: popupScale },
                  { translateY: popupHeight / 2 },
                  { translateX: -POPUP_WIDTH / 2 },
                ],
              }}
            >
              <GrainOverlay />

              <MenuRow
                label={task.done ? 'mark open' : 'mark done'}
                right={task.done ? <ThemeText variant="meta" color="amber">done</ThemeText> : undefined}
                onPress={handleToggleDone}
              />

              {/* Move to project */}
              <MenuRow
                label="move to project"
                right={proj
                  ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <ColorDot color={proj.color} size={6} />
                      <ThemeText variant="meta">{proj.name}</ThemeText>
                    </View>
                  : <ThemeText variant="meta" size={13} color="ink4">›</ThemeText>
                }
                onPress={() => setMovingProject(v => !v)}
              />

              {/* Project chips (expanded) */}
              {movingProject && (
                <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Chip active={task.project === null} onPress={() => handleMoveProject(null)}>
                        <ThemeText variant="chip" size={13} color={task.project === null ? 'ink' : 'ink2'}>none</ThemeText>
                      </Chip>
                      {projects.map(p => (
                        <Chip key={p.id} color={p.color} active={task.project === p.id} dot dotSize={5} onPress={() => handleMoveProject(p.id)}>
                          <ThemeText variant="chip" size={13} color={task.project === p.id ? p.color : 'ink2'}>{p.name}</ThemeText>
                        </Chip>
                      ))}
                    </View>
                  </ScrollView>
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
            </Animated.View>
          </>
        )}

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
