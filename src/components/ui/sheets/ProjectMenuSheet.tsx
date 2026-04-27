import React, { useEffect, useRef } from 'react';
import { View, TextInput, BackHandler } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useProjectMenuSheet } from '@/providers/ProjectMenuSheetProvider';
import { useHapticFeedback, useInlineEdit, useConfirmAction } from '@/hooks';
import { BottomSheet } from './BottomSheet';
import { SheetButtonRow } from './SheetButtonRow';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { ProjectAvatar } from '../cards/ProjectAvatar';
import { ThemeText } from '../primitives/ThemeText';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { Divider } from '../primitives/Divider';
import { MenuRow } from '../layout/MenuRow';
import { EditIcon, BookmarkIcon, FolderIcon, TrashIcon } from '@/assets/icons';
import { DELETE_COLOR, SHEET_PADDING_H } from '@/constants';

export function ProjectMenuSheet() {
  const { colors } = useTheme();
  const { notes, projects, pinProject, deleteProject, updateProjectColor, renameProject, archiveProject } = useStore();
  const { bottomSheetRef, activeProjectId, closeProjectMenu, onDeleteCallback } = useProjectMenuSheet();
  const { impact, notificationWarning } = useHapticFeedback();
  const inputRef = useRef<TextInput>(null);

  const proj = projects.find(p => p.id === activeProjectId);

  const { editing: renaming, draft: draftName, setDraft: setDraftName, startEditing: startRename, commitEdit: saveRename, cancelEdit: cancelRename } = useInlineEdit({
    initialValue: proj?.name ?? '',
    onSave: async (name) => {
      if (!proj) return;
      await renameProject(proj.id, name);
      impact();
    },
  });

  const confirmDelete = useConfirmAction({
    onConfirm: async () => {
      if (!proj) return;
      await deleteProject(proj.id);
      closeProjectMenu();
      onDeleteCallback.current?.();
    },
    onHaptic: notificationWarning,
  });

  useEffect(() => {
    confirmDelete.reset();
    cancelRename();
  }, [activeProjectId]);

  useEffect(() => {
    if (!renaming) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      cancelRename();
      return true;
    });
    return () => sub.remove();
  }, [renaming]);

  function handleSheetChange(index: number) {
    if (index === -1) {
      confirmDelete.reset();
      cancelRename();
    }
  }

  function handleStartRename() {
    if (!proj) return;
    startRename();
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleColorSelect(color: string) {
    if (!proj) return;
    await updateProjectColor(proj.id, color);
  }

  async function handlePin() {
    if (!proj) return;
    await pinProject(proj.id, !proj.pinned);
    impact();
    closeProjectMenu();
  }

  if (!proj) return null;

  return (
    <BottomSheet sheetRef={bottomSheetRef} onChange={handleSheetChange}>
      <View style={{ overflow: 'hidden' }}>
        <GrainOverlay />

        {/* Project header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SHEET_PADDING_H, paddingTop: 8, paddingBottom: 16 }}>
          <ProjectAvatar name={proj.name} color={proj.color} />
          <View style={{ flex: 1 }}>
            {renaming ? (
              <TextInput
                ref={inputRef}
                value={draftName}
                onChangeText={setDraftName}
                onSubmitEditing={saveRename}
                maxLength={30}
                style={{ fontFamily: FONT.kalam, fontSize: 16, color: colors.ink, padding: 0, borderBottomWidth: 1, borderBottomColor: colors.line }}
              />
            ) : (
              <ThemeText variant="title">{proj.name}</ThemeText>
            )}
            <ThemeText variant="meta" color="ink3">{notes.filter(n => n.project === proj.id && !n.archived).length} notes</ThemeText>
          </View>
        </View>

        <Divider />

        {/* Color picker */}
        <View style={{ paddingHorizontal: SHEET_PADDING_H, paddingTop: 14, paddingBottom: 14 }}>
          <ThemeText variant="meta" style={{ marginBottom: 10, fontFamily: FONT.kalam }} color="ink3">change color</ThemeText>
          <ColorSwatchPicker selectedColor={proj.color} onSelect={handleColorSelect} />
        </View>

        <Divider />

        {/* Menu rows */}
        <MenuRow
          icon={<EditIcon size={18} color={colors.ink3} />}
          label={renaming ? 'save name' : 'rename'}
          onPress={renaming ? saveRename : handleStartRename}
          showChevron
          paddingHorizontal={SHEET_PADDING_H}
          paddingVertical={16}
        />

        <MenuRow
          icon={<BookmarkIcon size={18} color={colors.ink3} />}
          label={proj.pinned ? 'unpin' : 'pin to top'}
          onPress={handlePin}
          showChevron
          paddingHorizontal={SHEET_PADDING_H}
          paddingVertical={16}
        />

        <MenuRow
          icon={<FolderIcon size={18} color={colors.ink3} />}
          label="archive"
          subtitle="hide without deleting"
          onPress={async () => {
            if (!proj) return;
            await archiveProject(proj.id, true);
            impact();
            closeProjectMenu();
            onDeleteCallback.current?.();
          }}
          showChevron
          paddingHorizontal={SHEET_PADDING_H}
          paddingVertical={16}
        />

        <MenuRow
          icon={<TrashIcon size={18} color={DELETE_COLOR} />}
          label={confirmDelete.needsConfirm ? 'tap again to confirm' : 'delete project'}
          subtitle="notes inside become unfiled"
          labelColor={DELETE_COLOR}
          subtitleColor={confirmDelete.needsConfirm ? DELETE_COLOR : 'ink4'}
          onPress={confirmDelete.handlePress}
          showChevron
          borderBottom={false}
          paddingHorizontal={SHEET_PADDING_H}
          paddingVertical={16}
        />

        {/* Cancel */}
        <View style={{ paddingHorizontal: SHEET_PADDING_H, marginTop: 12 }}>
          <SheetButtonRow onCancel={closeProjectMenu} />
        </View>
      </View>
    </BottomSheet>
  );
}
