import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, TextInput, BackHandler } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useProjectMenuSheet } from '@/providers/ProjectMenuSheetProvider';
import { useHapticFeedback } from '@/hooks';
import { BottomSheet } from './BottomSheet';
import { SheetButtonRow } from './SheetButtonRow';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { ProjectAvatar } from '../cards/ProjectAvatar';
import { ThemeText } from '../primitives/ThemeText';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { EditIcon, BookmarkIcon, FolderIcon, TrashIcon, ChevronIcon } from '@/assets/icons';
import { DELETE_COLOR, SHEET_PADDING_H } from '@/constants';

export function ProjectMenuSheet() {
  const { colors } = useTheme();
  const { notes, projects, pinProject, deleteProject, updateProjectColor, renameProject, archiveProject } = useStore();
  const { bottomSheetRef, activeProjectId, closeProjectMenu, onDeleteCallback } = useProjectMenuSheet();
  const { impact, notificationWarning } = useHapticFeedback();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const proj = projects.find(p => p.id === activeProjectId);

  useEffect(() => {
    setConfirmDelete(false);
    setRenaming(false);
  }, [activeProjectId]);

  useEffect(() => {
    if (!renaming) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setRenaming(false);
      return true;
    });
    return () => sub.remove();
  }, [renaming]);

  function handleSheetChange(index: number) {
    if (index === -1) {
      setConfirmDelete(false);
      setRenaming(false);
    }
  }

  function handleStartRename() {
    if (!proj) return;
    setDraftName(proj.name);
    setRenaming(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSaveRename() {
    if (!proj || !draftName.trim()) return;
    await renameProject(proj.id, draftName.trim());
    setRenaming(false);
    impact();
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

  async function handleDelete() {
    if (!proj) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    notificationWarning();
    await deleteProject(proj.id);
    closeProjectMenu();
    onDeleteCallback.current?.();
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
                onSubmitEditing={handleSaveRename}
                maxLength={30}
                style={{ fontFamily: FONT.kalam, fontSize: 16, color: colors.ink, padding: 0, borderBottomWidth: 1, borderBottomColor: colors.line }}
              />
            ) : (
              <ThemeText variant="title">{proj.name}</ThemeText>
            )}
            <ThemeText variant="meta" color="ink3">{notes.filter(n => n.project === proj.id && !n.archived).length} notes</ThemeText>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: -0 }} />

        {/* Color picker */}
        <View style={{ paddingHorizontal: SHEET_PADDING_H, paddingTop: 14, paddingBottom: 14 }}>
          <ThemeText variant="meta" style={{ marginBottom: 10, fontFamily: FONT.kalam }} color="ink3">change color</ThemeText>
          <ColorSwatchPicker selectedColor={proj.color} onSelect={handleColorSelect} />
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.line2 }} />

        {/* Menu rows */}
        {/* Rename */}
        <TouchableOpacity
          onPress={renaming ? handleSaveRename : handleStartRename}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SHEET_PADDING_H, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 14 }}
        >
          <EditIcon size={18} color={colors.ink3} />
          <ThemeText variant="body" style={{ flex: 1 }} color="ink2">{renaming ? 'save name' : 'rename'}</ThemeText>
          <ChevronIcon size={14} color={colors.ink4} />
        </TouchableOpacity>

        {/* Pin to top */}
        <TouchableOpacity
          onPress={handlePin}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SHEET_PADDING_H, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 14 }}
        >
          <BookmarkIcon size={18} color={colors.ink3} />
          <ThemeText variant="body" style={{ flex: 1 }} color="ink2">{proj.pinned ? 'unpin' : 'pin to top'}</ThemeText>
          <ChevronIcon size={14} color={colors.ink4} />
        </TouchableOpacity>

        {/* Archive */}
        <TouchableOpacity
          onPress={async () => {
            if (!proj) return;
            await archiveProject(proj.id, true);
            impact();
            closeProjectMenu();
            onDeleteCallback.current?.();
          }}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SHEET_PADDING_H, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 14 }}
        >
          <FolderIcon size={18} color={colors.ink3} />
          <View style={{ flex: 1 }}>
            <ThemeText variant="body" color="ink2">archive</ThemeText>
            <ThemeText variant="meta" color="ink4">hide without deleting</ThemeText>
          </View>
          <ChevronIcon size={14} color={colors.ink4} />
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SHEET_PADDING_H, paddingVertical: 16, gap: 14 }}
        >
          <TrashIcon size={18} color={DELETE_COLOR} />
          <View style={{ flex: 1 }}>
            <ThemeText variant="body" color={DELETE_COLOR}>
              {confirmDelete ? 'tap again to confirm' : 'delete project'}
            </ThemeText>
            <ThemeText variant="meta" color={confirmDelete ? DELETE_COLOR : 'ink4'}>notes inside become unfiled</ThemeText>
          </View>
          <ChevronIcon size={14} color={colors.ink4} />
        </TouchableOpacity>

        {/* Cancel */}
        <View style={{ paddingHorizontal: SHEET_PADDING_H, marginTop: 12 }}>
          <SheetButtonRow onCancel={closeProjectMenu} />
        </View>
      </View>
    </BottomSheet>
  );
}
