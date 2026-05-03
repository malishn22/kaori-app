import React, { useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFolderNotes, useFolderTasks, useHapticFeedback, useAnimatedPopup, useConfirmAction } from '@/hooks';
import { useStore } from '@/providers/StoreProvider';
import { NoteCard, TaskCard, FAB, ThemeText, HeaderText, ColorDot, PageHeader, SectionTitle, MenuRow, ColorSwatchPicker, CountedInput, PagedSections, PopupMenu, GrainOverlay } from '@/components/ui';
import { DELETE_COLOR, BUTTON_TEXT_ON_ACCENT } from '@/constants';

export default function FolderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { folder, notes, notesThisWeek, pinnedCount } = useFolderNotes(id);
  const { tasks, openCount } = useFolderTasks(id);
  const { toggleTask, pinFolder, deleteFolder, updateFolderColor, renameFolder, archiveFolder } = useStore();
  const { impact, notificationWarning } = useHapticFeedback();

  const [menuOpen, setMenuOpen] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { anim: menuAnim, opacity: popupOpacity, open: openPopup, close: closePopup } = useAnimatedPopup();
  const { anim: fabAnim, opacity: fabOpacity, open: openFab, close: closeFab } = useAnimatedPopup();

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

  const popupTop = insets.top + 16 + 52 + 8;

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader
        onBack={() => router.back()}
        editButton={{ onPress: () => renaming ? handleSaveRename() : handleStartRename(), active: renaming }}
        moreButton={{ onPress: openMenu }}
      />

      {/* Hero card */}
      <View className="px-[18px] pt-3">
        <View className="bg-theme-paper2 rounded-[22px] p-5 pb-[18px] border border-theme-line2 overflow-hidden relative">
          <GrainOverlay />
          {/* Folded corner */}
          <View className="absolute top-0 right-0 w-7 h-7 bg-transparent rounded-tr-[22px] overflow-hidden">
            <View className="absolute top-0 right-0 w-7 h-7" style={{ backgroundColor: 'rgba(232,200,154,0.12)', transform: [{ rotate: '45deg' }, { translateX: 14 }] }} />
          </View>

          <View className="flex-row items-center gap-2 mb-1.5">
            <ColorDot color={folder.color} size={10} />
            {renaming ? (
              <View className="flex-1">
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
          <View className="flex-row gap-[18px] mt-3">
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
        <View className="px-4 pt-6">
          <TouchableOpacity
            onPress={handleSaveRename}
            disabled={!draftName.trim()}
            className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
            style={{ opacity: draftName.trim() ? 1 : 0.4 }}
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
          <View className="px-6 pb-3">
            <SectionTitle underlineWidth={48}>notes</SectionTitle>
          </View>
          <View className="px-[18px] gap-3">
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
          <View className="px-6 pb-3">
            <SectionTitle underlineWidth={42}>tasks</SectionTitle>
          </View>
          <View className="px-[18px] gap-3">
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
      <PopupMenu visible={fabMenuOpen} onClose={() => closeFabMenu()} anim={fabAnim} opacity={fabOpacity} anchor="bottom-right" bottom={insets.bottom + 140} right={20}>
        <MenuRow
          label="note"
          onPress={() => closeFabMenu(() => router.push(`/note/new?folderId=${folder.id}`))}
        />
        <MenuRow
          label="task"
          onPress={() => closeFabMenu(() => router.push(`/task/new?folderId=${folder.id}`))}
          borderBottom={false}
        />
      </PopupMenu>

      {/* Popup menu */}
      <PopupMenu visible={menuOpen} onClose={() => closeMenu()} anim={menuAnim} opacity={popupOpacity} anchor="top-right" top={popupTop}>
        <MenuRow
          label="change color"
          right={<ColorDot color={folder.color} size={8} />}
          onPress={() => setShowColorPicker(v => !v)}
        />

        {showColorPicker && (
          <View className="px-3 py-2.5 border-b border-theme-line">
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
      </PopupMenu>
    </View>
  );
}
