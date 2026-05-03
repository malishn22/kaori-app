import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Share, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useAnimatedPopup, useInlineEdit, useConfirmAction, useActiveFolders } from '@/hooks';
import { ThemeText, ColorDot, Chip, PageHeader, LinkedText, ConfirmationDialog, MenuRow, PopupMenu, FolderChipSelector } from '@/components/ui';
import { toEditableText, fromEditableText, getDomain } from '@/utils/links';
import { FONT } from '@/theme';
import { BUTTON_TEXT_ON_ACCENT, DELETE_COLOR } from '@/constants';

export default function NoteDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, updateNote, deleteNote, archiveNote } = useStore();
  const folders = useActiveFolders();
  const note = notes.find(n => n.id === id);
  const folder = note?.folder ? folders.find(f => f.id === note.folder) : undefined;

  const { impactOnSave, impact, notificationWarning } = useHapticFeedback();

  const { editing, draft, setDraft, startEditing, cancelEdit } = useInlineEdit({
    initialValue: note?.text ?? '',
    onSave: async (trimmed) => {
      const { text, links } = fromEditableText(trimmed);
      await updateNote(note!.id, { text, links });
      impactOnSave();
    },
  });

  const confirmDelete = useConfirmAction({
    onConfirm: async () => {
      await deleteNote(note!.id);
      setMenuOpen(false);
      router.back();
    },
    onHaptic: notificationWarning,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [movingFolder, setMovingFolder] = useState(false);
  const [linkAction, setLinkAction] = useState<{ url: string; label: string } | null>(null);

  const { anim: menuAnim, opacity: popupOpacity, open: openPopup, close: closePopup } = useAnimatedPopup();

  if (!note) return null;

  const wordCount = (editing ? draft : note.text).trim().split(/\s+/).filter(Boolean).length;

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

  async function handleSave() {
    if (!draft.trim()) return;
    const { text, links } = fromEditableText(draft.trim());
    await updateNote(note!.id, { text, links });
    impactOnSave();
    cancelEdit();
  }

  async function handleShare() {
    closeMenu(async () => {
      await Share.share({ message: note?.text ?? '' });
    });
  }

  async function handlePin() {
    await updateNote(note?.id ?? '', { pinned: !note?.pinned });
    impact();
    closeMenu();
  }

  async function handleMoveFolder(folderId: string | null) {
    await updateNote(note!.id, { folder: folderId });
    impact();
    closeMenu();
  }

  function handleBack() {
    if (editing) {
      cancelEdit();
    } else {
      router.back();
    }
  }

  function handleLinkPress(url: string, label: string) {
    setLinkAction({ url, label });
  }

  const popupTop = insets.top + 16 + 52 + 8;

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader
        onBack={handleBack}
        editButton={{ onPress: () => startEditing(toEditableText(note.text, note.links)), active: editing }}
        moreButton={{ onPress: openMenu }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6">
          {/* Folder pill */}
          {folder && (
            <View className="self-start mb-4">
              <Chip color={folder.color} dot dotSize={7}>
                <ThemeText variant="chip" size={12} color="cream">{folder.name}</ThemeText>
              </Chip>
            </View>
          )}

          {/* Main text */}
          {editing ? (
            <TextInput
              style={{
                fontFamily: FONT.kalam,
                fontSize: 26,
                color: colors.ink,
                lineHeight: 36,
                letterSpacing: 0.1,
                textAlignVertical: 'top',
              }}
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              selectionColor={colors.amber}
              cursorColor={colors.amber}
            />
          ) : (
            <LinkedText
              text={note.text}
              links={note.links}
              variant="heading"
              size={26}
              lineHeight={36}
              letterSpacing={0.1}
              onLinkPress={handleLinkPress}
            />
          )}

          {/* Meta */}
          <View className="flex-row gap-3 mt-[18px]">
            <ThemeText variant="meta">
              {note.date === 'today' ? 'today' : note.date}, {note.time}
            </ThemeText>
            <ThemeText variant="meta" style={{ opacity: 0.4 }}>·</ThemeText>
            <ThemeText variant="meta">{wordCount} words</ThemeText>
          </View>
        </View>

        {/* Tags */}
        {note.tags.length > 0 && (
          <View className="px-[18px] pt-6">
            <View className="bg-theme-paper rounded-card p-4 border border-theme-line overflow-hidden">
              <GrainOverlay />
              <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 8 }}>
                tags
              </ThemeText>
              <View className="flex-row flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <Chip key={tag} paddingVertical={4}>
                    <ThemeText variant="chip" size={13} color="ink2">#{tag}</ThemeText>
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Save bar */}
        {editing ? (
          <View className="px-4 pt-6">
            <TouchableOpacity
              onPress={handleSave}
              disabled={!draft.trim()}
              className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
              style={{ opacity: draft.trim() ? 1 : 0.4 }}
              activeOpacity={0.85}
            >
              <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>save</ThemeText>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Popup menu */}
      <PopupMenu visible={menuOpen} onClose={() => closeMenu()} anim={menuAnim} opacity={popupOpacity} anchor="top-right" top={popupTop}>
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
            <FolderChipSelector folders={folders} selected={note.folder} onSelect={handleMoveFolder} />
          </View>
        )}

        <MenuRow
          label={note.pinned ? 'unpin' : 'pin'}
          right={note.pinned ? <ThemeText variant="meta" color="amber">pinned</ThemeText> : undefined}
          onPress={handlePin}
        />

        <MenuRow label="share" onPress={handleShare} />

        <MenuRow
          label="archive"
          onPress={async () => {
            await archiveNote(note!.id, true);
            impact();
            setMenuOpen(false);
            router.back();
          }}
        />

        <MenuRow
          label={confirmDelete.needsConfirm ? 'tap again to confirm' : 'delete'}
          labelColor={DELETE_COLOR}
          onPress={confirmDelete.handlePress}
          borderBottom={false}
        />
      </PopupMenu>

      {/* Link action dialog */}
      <ConfirmationDialog
        visible={!!linkAction}
        title={linkAction?.label ?? ''}
        subtitle={linkAction ? getDomain(linkAction.url) : undefined}
        actions={[
          {
            label: 'open link',
            color: 'amber',
            onPress: () => {
              if (linkAction) Linking.openURL(linkAction.url);
              setLinkAction(null);
            },
          },
        ]}
        onClose={() => setLinkAction(null)}
      />

    </View>
  );
}
