import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Share, Animated, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useAnimatedPopup } from '@/hooks';
import { GrainOverlay, ThemeText, ColorDot, Chip, ScreenHeader, HeaderEditButton, ShowMoreButton, LinkedText, ConfirmationDialog } from '@/components/ui';
import { toEditableText, fromEditableText, getDomain } from '@/utils/links';
import { FONT } from '@/theme';
import { POPUP_WIDTH, SHADOW_POPUP, BUTTON_TEXT_ON_ACCENT, DELETE_COLOR } from '@/constants';

export default function NoteDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, projects: allProjects, updateNote, deleteNote, archiveNote } = useStore();
  const projects = allProjects.filter(p => !p.archived);
  const note = notes.find(n => n.id === id);
  const proj = note?.project ? projects.find(p => p.id === note.project) : undefined;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note?.text ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [movingProject, setMovingProject] = useState(false);
  const [popupHeight, setPopupHeight] = useState(0);
  const [linkAction, setLinkAction] = useState<{ url: string; label: string } | null>(null);

  const { anim: menuAnim, opacity: popupOpacity, open: openPopup, close: closePopup } = useAnimatedPopup();
  const { impactOnSave, impact, notificationWarning } = useHapticFeedback();

  if (!note) return null;

  const wordCount = (editing ? draft : note.text).trim().split(/\s+/).filter(Boolean).length;

  function openMenu() {
    setConfirmDelete(false);
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

  async function handleSave() {
    if (!draft.trim()) return;
    const { text, links } = fromEditableText(draft.trim());
    await updateNote(note!.id, { text, links });
    impactOnSave();
    setEditing(false);
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

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    notificationWarning();
    await deleteNote(note!.id);
    setMenuOpen(false);
    router.back();
  }

  async function handleMoveProject(projectId: string | null) {
    await updateNote(note!.id, { project: projectId });
    impact();
    closeMenu();
  }

  function handleBack() {
    if (editing) {
      setEditing(false);
    } else {
      router.back();
    }
  }

  function handleLinkPress(url: string, label: string) {
    setLinkAction({ url, label });
  }

  const popupScale = menuAnim;

  // Header height for popup positioning: safe area top + 16 padding + 52 row height
  const popupTop = insets.top + 16 + 52 + 8;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        onBack={handleBack}
        rightActions={[
          { icon: <HeaderEditButton color={editing ? colors.amber : colors.ink2} onPress={() => { setDraft(toEditableText(note.text, note.links)); setEditing(true); }} /> },
          { icon: <ShowMoreButton color={colors.ink2} onPress={openMenu} /> },
        ]}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          {/* Project pill */}
          {proj && (
            <View style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
              <Chip color={proj.color} dot dotSize={7}>
                <ThemeText variant="chip" size={12} color="cream">{proj.name}</ThemeText>
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
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
            <ThemeText variant="meta">
              {note.date === 'today' ? 'today' : note.date}, {note.time}
            </ThemeText>
            <ThemeText variant="meta" style={{ opacity: 0.4 }}>·</ThemeText>
            <ThemeText variant="meta">{wordCount} words</ThemeText>
          </View>
        </View>

        {/* Tags */}
        {note.tags.length > 0 && (
          <View style={{ paddingHorizontal: 18, paddingTop: 24 }}>
            <View style={{
              backgroundColor: colors.paper,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.line,
              overflow: 'hidden',
            }}>
              <GrainOverlay />
              <ThemeText variant="caption" size={11} letterSpacing={0.4} style={{ marginBottom: 8 }}>
                tags
              </ThemeText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {note.tags.map((tag) => (
                  <Chip key={tag} paddingVertical={4}>
                    <ThemeText variant="chip" size={13} color="ink2">#{tag}</ThemeText>
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save bar / Home indicator */}
      {editing ? (
        <TouchableOpacity
          onPress={handleSave}
          disabled={!draft.trim()}
          style={{
            margin: 16,
            height: 52,
            borderRadius: 16,
            backgroundColor: colors.amber,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: draft.trim() ? 1 : 0.4,
          }}
          activeOpacity={0.85}
        >
          <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>save</ThemeText>
        </TouchableOpacity>
      ) : null}

      {/* Popup menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={() => closeMenu()}
          />

          {/* Animated popup card */}
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

            {/* Move to project */}
            <TouchableOpacity
              onPress={() => setMovingProject(v => !v)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              <ThemeText variant="body" style={{ flex: 1 }}>move to project</ThemeText>
              {proj
                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <ColorDot color={proj.color} size={6} />
                    <ThemeText variant="meta">{proj.name}</ThemeText>
                  </View>
                : <ThemeText variant="meta" size={13} color="ink4">›</ThemeText>
              }
            </TouchableOpacity>

            {/* Project chips (expanded) */}
            {movingProject && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Chip active={note.project === null} onPress={() => handleMoveProject(null)}>
                      <ThemeText variant="chip" size={13} color={note.project === null ? 'ink' : 'ink2'}>none</ThemeText>
                    </Chip>
                    {projects.map(p => (
                      <Chip key={p.id} color={p.color} active={note.project === p.id} dot dotSize={5} onPress={() => handleMoveProject(p.id)}>
                        <ThemeText variant="chip" size={13} color={note.project === p.id ? p.color : 'ink2'}>{p.name}</ThemeText>
                      </Chip>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Pin / Unpin */}
            <TouchableOpacity
              onPress={handlePin}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              <ThemeText variant="body" style={{ flex: 1 }}>{note.pinned ? 'unpin' : 'pin'}</ThemeText>
              {note.pinned && <ThemeText variant="meta" color="amber">pinned</ThemeText>}
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              <ThemeText variant="body">share</ThemeText>
            </TouchableOpacity>

            {/* Archive */}
            <TouchableOpacity
              onPress={async () => {
                await archiveNote(note!.id, true);
                impact();
                setMenuOpen(false);
                router.back();
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              <ThemeText variant="body">archive</ThemeText>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <ThemeText variant="body" color={DELETE_COLOR}>
                {confirmDelete ? 'tap again to confirm' : 'delete'}
              </ThemeText>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

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
    </KeyboardAvoidingView>
  );
}
