import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useProjectMenuSheet } from '@/providers/ProjectMenuSheetProvider';
import { useHapticFeedback } from '@/hooks';
import { BottomSheet } from './BottomSheet';
import { ThemeText } from '../primitives/ThemeText';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { IconPen, IconBookmark, IconFolder, IconTrash, IconChev } from '@/assets/icons';
import { PROJECT_COLORS } from '@/constants';

const CORAL = '#c97060';

export function ProjectMenuSheet() {
  const { colors } = useTheme();
  const { projects, pinProject, deleteProject, updateProjectColor } = useStore();
  const { bottomSheetRef, activeProjectId, closeProjectMenu, onDeleteCallback } = useProjectMenuSheet();
  const { impact, notificationWarning } = useHapticFeedback();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const proj = projects.find(p => p.id === activeProjectId);

  function handleSheetChange(index: number) {
    if (index === -1) setConfirmDelete(false);
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 }}>
          <View style={{
            width: 42, height: 42, borderRadius: 12,
            backgroundColor: `${proj.color}1c`,
            borderWidth: 1,
            borderColor: `${proj.color}33`,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ThemeText variant="heading" color={proj.color}>
              {proj.name.charAt(0).toLowerCase()}
            </ThemeText>
          </View>
          <View>
            <ThemeText variant="title">{proj.name}</ThemeText>
            <ThemeText variant="meta" color="ink3">{proj.count} ideas</ThemeText>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: -0 }} />

        {/* Color picker */}
        <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 14 }}>
          <ThemeText variant="meta" style={{ marginBottom: 10, fontFamily: FONT.kalam }} color="ink3">change color</ThemeText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {PROJECT_COLORS.map((color) => {
              const isSelected = proj.color === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => handleColorSelect(color)}
                  activeOpacity={0.8}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: color,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? `${color}88` : 'transparent',
                  }}
                >
                  {isSelected && (
                    <ThemeText variant="meta" style={{ color: '#1a140a', fontFamily: FONT.kalam, fontSize: 14 }}>✓</ThemeText>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.line2 }} />

        {/* Menu rows */}
        {/* Rename */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 14 }}
        >
          <IconPen size={18} color={colors.ink3} />
          <ThemeText variant="body" style={{ flex: 1 }} color="ink2">rename</ThemeText>
          <IconChev size={14} color={colors.ink4} />
        </TouchableOpacity>

        {/* Pin to top */}
        <TouchableOpacity
          onPress={handlePin}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 14 }}
        >
          <IconBookmark size={18} color={colors.ink3} />
          <ThemeText variant="body" style={{ flex: 1 }} color="ink2">{proj.pinned ? 'unpin' : 'pin to top'}</ThemeText>
          <IconChev size={14} color={colors.ink4} />
        </TouchableOpacity>

        {/* Archive */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 14 }}
        >
          <IconFolder size={18} color={colors.ink3} />
          <View style={{ flex: 1 }}>
            <ThemeText variant="body" color="ink2">archive</ThemeText>
            <ThemeText variant="meta" color="ink4">hide without deleting</ThemeText>
          </View>
          <IconChev size={14} color={colors.ink4} />
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16, gap: 14 }}
        >
          <IconTrash size={18} color={CORAL} />
          <View style={{ flex: 1 }}>
            <ThemeText variant="body" color={CORAL}>
              {confirmDelete ? 'tap again to confirm' : 'delete project'}
            </ThemeText>
            <ThemeText variant="meta" color={confirmDelete ? CORAL : 'ink4'}>ideas inside become unfiled</ThemeText>
          </View>
          <IconChev size={14} color={colors.ink4} />
        </TouchableOpacity>

        {/* Cancel */}
        <View style={{ paddingHorizontal: 22, marginTop: 12 }}>
          <TouchableOpacity
            onPress={closeProjectMenu}
            style={{
              height: 48, borderRadius: 14,
              borderWidth: 1, borderColor: colors.line2,
              alignItems: 'center', justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <ThemeText variant="label" size={14} color="ink2" style={{ fontFamily: FONT.geistMedium }}>cancel</ThemeText>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
