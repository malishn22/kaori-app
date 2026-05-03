import React, { useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useFolderNotes, useFolderTasks, useHapticFeedback, useAnimatedPopup, useConfirmAction } from '@/hooks';
import { useStore } from '@/providers/StoreProvider';
import { NoteCard, TaskCard, FAB, GrainOverlay, ThemeText, HeaderText, ColorDot, PageHeader, SectionTitle, MenuRow, ColorSwatchPicker, CountedInput, PagedSections } from '@/components/ui';
import { POPUP_WIDTH, SHADOW_POPUP, DELETE_COLOR, BUTTON_TEXT_ON_ACCENT } from '@/constants';

export default function FolderDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { folder, notes, notesThisWeek, pinnedCount } = useFolderNotes(id);
  const { tasks, openCount } = useFolderTasks(id);
  const { toggleTask, pinFolder, deleteFolder, updateFolderColor, renameFolder, archiveFolder } = useStore();
  const { impact, notificationWarning } = useHapticFeedback();

  const [menuOpen, setMenuOpen] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [popupHeight, setPopupHeight] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { anim: menuAnim, opacity: popupOpacity, open: openPopup, close: closePopup } = useAnimatedPopup();
  const { anim: fabAnim, opacity: fabOpacity, open: openFab, close: closeFab } = useAnimatedPopup();
  const [fabPopupHeight, setFabPopupHeight] = useState(0);

  const confirmDelete = useConfirmAction({
    onConfirm: async () => {
      await deleteFolder(folder!.id);
      setMenuOpen(false);
      router.back();
    },
    onHaptic: notificationWarning,
  });

  if (!folder) return null;

  function openMenu() {
    confirmDelete.reset();
    setShowColorPicker(false);
    setMenuOpen(true);
    openPopup();
  }

  function closeMenu(cb?: () => void) {
    closePopup(() => {
      setMenuOpen(false);
      cb?.();
    });
  }

  function closeFabMenu(cb?: () => void) {
    closeFab(() => {
      setFabMenuOpen(false);
      cb?.();
    });
  }

  function handleStartRename() {
    setDraftName(folder!.name);
    setRenaming(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSaveRename() {
    if (!draftName.trim()) return;
    await renameFolder(folder!.id, draftName.trim());
    impact();
    setRenaming(false);
  }

  async function handleColorSelect(color: string) {
    await updateFolderColor(folder!.id, color);
    impact();
  }

  async function handlePin() {
    await pinFolder(folder!.id, !folder!.pinned);
    impact();
    closeMenu();
  }

  async function handleArchive() {
    await archiveFolder(folder!.id, true);
    impact();
    setMenuOpen(false);
    router.back();
  }

  const popupScale = menuAnim;
  const popupTop = insets.top + 16 + 52 + 8;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader
        onBack={() => router.back()}
        editButton={{ onPress: () => renaming ? handleSaveRename() : handleStartRename(), active: renaming }}
        moreButton={{ onPress: openMenu }}
      />

      {/* Hero card */}
      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <View style={{
          backgroundColor: colors.paper2,
          borderRadius: 22,
          padding: 20,
          paddingBottom: 18,
          borderWidth: 1,
          borderColor: colors.line2,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <GrainOverlay />
          {/* Folded corner */}
          <View style={{
            position: 'absolute', top: 0, right: 0, width: 28, height: 28,
            backgroundColor: 'transparent',
            borderTopRightRadius: 22,
            overflow: 'hidden',
          }}>
            <View style={{
              position: 'absolute', top: 0, right: 0,
              width: 28, height: 28,
              backgroundColor: 'rgba(232,200,154,0.12)',
              transform: [{ rotate: '45deg' }, { translateX: 14 }],
            }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <ColorDot color={folder.color} size={10} />
            {renaming ? (
              <View style={{ flex: 1 }}>
                <CountedInput
                  ref={inputRef}
                  value={draftName}
                  onChangeText={(t) => setDraftName(t.slice(0, 30))}
                  maxLength={30}
                  onSubmitEditing={handleSaveRename}
                  style={{ fontSize: 22, lineHeight: 30 }}
                />
              </View>
            ) : (
              <HeaderText size={26} lineHeight={30}>{folder.name}</HeaderText>
            )}
          </View>
          {folder.note ? (
            <ThemeText variant="meta" size={13} color="ink2" style={{ marginTop: 4, lineHeight: 20 }}>
              {folder.note}
            </ThemeText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
            {[
              { val: notes.length, label: 'notes' },
              { val: openCount, label: 'tasks' },
              { val: notesThisWeek, label: 'this week' },
              { val: pinnedCount, label: 'pinned' },
            ].map(({ val, label }) => (
              <ThemeText key={label} variant="meta">
                <ThemeText variant="chip" color="cream" size={16}>{val} </ThemeText>
                {label}
              </ThemeText>
            ))}
          </View>
        </View>
      </View>

      {/* Save button */}
      {renaming && (
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <TouchableOpacity
            onPress={handleSaveRename}
            disabled={!draftName.trim()}
            style={{
              height: 52,
              borderRadius: 16,
              backgroundColor: colors.amber,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: draftName.trim() ? 1 : 0.4,
            }}
            activeOpacity={0.85}
          >
            <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>save</ThemeText>
          </TouchableOpacity>
        </View>
      )}

      {/* Notes & Tasks pager */}
      <PagedSections>
        {/* Notes page */}
        <ScrollView
          contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 180 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
            <SectionTitle underlineWidth={48}>notes</SectionTitle>
          </View>
          <View style={{ paddingHorizontal: 18, gap: 12 }}>
            {notes.map((note, ix) => (
              <TouchableOpacity key={note.id} onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                <NoteCard note={note} folder={folder} index={ix + 1} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Tasks page */}
        <ScrollView
          contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 180 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
            <SectionTitle underlineWidth={42}>tasks</SectionTitle>
          </View>
          <View style={{ paddingHorizontal: 18, gap: 12 }}>
            {tasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                folder={folder}
                index={i}
                onToggle={() => toggleTask(task.id)}
                onPress={() => router.push(`/task/${task.id}`)}
              />
            ))}
          </View>
        </ScrollView>
      </PagedSections>

      <FAB onPress={() => {
        if (fabMenuOpen) {
          closeFabMenu();
        } else {
          setFabMenuOpen(true);
          openFab();
        }
      }} />

      {/* FAB popup — note or task */}
      {fabMenuOpen && (
        <>
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={() => closeFabMenu()}
          />
          <Animated.View
            onLayout={e => setFabPopupHeight(e.nativeEvent.layout.height)}
            style={{
              position: 'absolute',
              right: 20,
              bottom: insets.bottom + 140,
              width: POPUP_WIDTH,
              backgroundColor: colors.paper,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.line2,
              overflow: 'hidden',
              ...SHADOW_POPUP,
              opacity: fabOpacity,
              transform: [
                { translateX: POPUP_WIDTH / 2 },
                { translateY: fabPopupHeight / 2 },
                { scale: fabAnim },
                { translateY: -fabPopupHeight / 2 },
                { translateX: -POPUP_WIDTH / 2 },
              ],
            }}
          >
            <GrainOverlay />
            <MenuRow
              label="note"
              onPress={() => closeFabMenu(() => router.push(`/note/new?folderId=${folder.id}`))}
            />
            <MenuRow
              label="task"
              onPress={() => closeFabMenu(() => router.push(`/task/new?folderId=${folder.id}`))}
              borderBottom={false}
            />
          </Animated.View>
        </>
      )}

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

            {/* Color picker */}
            <MenuRow
              label="change color"
              right={<ColorDot color={folder.color} size={8} />}
              onPress={() => setShowColorPicker(v => !v)}
            />

            {showColorPicker && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                <ColorSwatchPicker selectedColor={folder.color} onSelect={handleColorSelect} />
              </View>
            )}

            <MenuRow
              label={folder.pinned ? 'unpin' : 'pin to top'}
              right={folder.pinned ? <ThemeText variant="meta" color="amber">pinned</ThemeText> : undefined}
              onPress={handlePin}
            />

            <MenuRow label="archive" onPress={handleArchive} />

            <MenuRow
              label={confirmDelete.needsConfirm ? 'tap again to confirm' : 'delete folder'}
              labelColor={DELETE_COLOR}
              onPress={confirmDelete.handlePress}
              borderBottom={false}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}
