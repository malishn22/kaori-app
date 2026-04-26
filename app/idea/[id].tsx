import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Share, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useAnimatedPopup } from '@/hooks';
import { GrainOverlay, ThemeText, ColorDot, Chip, ScreenHeader, HeaderEditButton, ShowMoreButton } from '@/components/ui';
import { FONT } from '@/theme';

const POPUP_WIDTH = 220;

export default function IdeaDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ideas, projects, updateIdea, deleteIdea } = useStore();
  const idea = ideas.find(i => i.id === id);
  const proj = idea?.project ? projects.find(p => p.id === idea.project) : undefined;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(idea?.text ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [movingProject, setMovingProject] = useState(false);

  const { anim: menuAnim, opacity: popupOpacity, open: openPopup, close: closePopup } = useAnimatedPopup();
  const { impactOnSave, impact, notificationWarning } = useHapticFeedback();

  if (!idea) return null;

  const wordCount = (editing ? draft : idea.text).trim().split(/\s+/).filter(Boolean).length;

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
    await updateIdea(idea!.id, { text: draft.trim() });
    impactOnSave();
    setEditing(false);
  }

  async function handleShare() {
    closeMenu(async () => {
      await Share.share({ message: idea?.text ?? '' });
    });
  }

  async function handlePin() {
    await updateIdea(idea?.id ?? '', { pinned: !idea?.pinned });
    impact();
    closeMenu();
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    notificationWarning();
    await deleteIdea(idea!.id);
    setMenuOpen(false);
    router.back();
  }

  async function handleMoveProject(projectId: string | null) {
    await updateIdea(idea!.id, { project: projectId });
    impact();
    closeMenu();
  }

  function handleBack() {
    if (editing) {
      setDraft(idea!.text);
      setEditing(false);
    } else {
      router.back();
    }
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
          { icon: <HeaderEditButton color={editing ? colors.amber : colors.ink2} onPress={() => { setDraft(idea.text); setEditing(true); }} /> },
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
            <ThemeText variant="heading" size={26} lineHeight={36} letterSpacing={0.1} color="ink">
              {idea.text}
            </ThemeText>
          )}

          {/* Meta */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
            <ThemeText variant="meta">
              {idea.date === 'today' ? 'today' : idea.date}, {idea.time}
            </ThemeText>
            <ThemeText variant="meta" style={{ opacity: 0.4 }}>·</ThemeText>
            <ThemeText variant="meta">{wordCount} words</ThemeText>
          </View>
        </View>

        {/* Tags */}
        {idea.tags.length > 0 && (
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
                {idea.tags.map((tag) => (
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
          <ThemeText variant="button" color="#1a140a">save</ThemeText>
        </TouchableOpacity>
      ) : (
        <View style={{ height: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
          <View style={{ width: 108, height: 4, borderRadius: 2, backgroundColor: colors.ink4 }} />
        </View>
      )}

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
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 12,
              opacity: popupOpacity,
              transform: [
                { translateX: POPUP_WIDTH / 2 },
                { translateY: -60 },
                { scale: popupScale },
                { translateY: 60 },
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
                    <Chip active={idea.project === null} onPress={() => handleMoveProject(null)}>
                      <ThemeText variant="chip" size={13} color={idea.project === null ? 'ink' : 'ink2'}>none</ThemeText>
                    </Chip>
                    {projects.map(p => (
                      <Chip key={p.id} color={p.color} active={idea.project === p.id} dot dotSize={5} onPress={() => handleMoveProject(p.id)}>
                        <ThemeText variant="chip" size={13} color={idea.project === p.id ? p.color : 'ink2'}>{p.name}</ThemeText>
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
              <ThemeText variant="body" style={{ flex: 1 }}>{idea.pinned ? 'unpin' : 'pin'}</ThemeText>
              {idea.pinned && <ThemeText variant="meta" color="amber">pinned</ThemeText>}
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
              <ThemeText variant="body" color="#c97060">
                {confirmDelete ? 'tap again to confirm' : 'delete'}
              </ThemeText>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

    </View>
    </KeyboardAvoidingView>
  );
}
