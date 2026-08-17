import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Canvas } from 'kaori-core';
import { useCanvases } from '@/providers/CanvasProvider';
import { FAB, PageHeader, ThemeText, EmptyState, SwipeablePinWrapper } from '@/components/ui';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';
import { useTheme } from '@/theme';

export default function CanvasScreen() {
  const router = useRouter();
  const { canvases, addCanvas, pinCanvas } = useCanvases();

  const togglePin = (canvas: Canvas) => {
    void pinCanvas(canvas.id, !canvas.pinned);
  };

  const visible = canvases.filter((c) => !c.archived);
  const pinned = visible.filter((c) => c.pinned);
  const rest = visible.filter((c) => !c.pinned);

  // A canvas row is created up front rather than on first save: unlike a note there is no
  // draft to hold in memory, and the very first stroke needs somewhere to save to.
  async function createAndOpen() {
    const canvas = await addCanvas('untitled');
    router.push(`/canvas/${canvas.id}`);
  }

  // EmptyState is a whole screen — it renders its own header and a wide FAB.
  if (visible.length === 0) return <EmptyState variant="canvas" onFAB={createAndOpen} />;

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader caption="your drawings" title="canvas" underlineWidth={82} settingsButton />

      <ScrollView
        // The tab bar is absolutely positioned, so the last row would sit under it.
        contentContainerStyle={{ paddingBottom: TAB_BAR_BASE_HEIGHT + 48 }}
      >
        {pinned.length > 0 && (
          <Section
            title="pinned"
            canvases={pinned}
            onPress={(id) => router.push(`/canvas/${id}`)}
            onTogglePin={togglePin}
          />
        )}
        <Section
          title={pinned.length > 0 ? 'canvases' : undefined}
          canvases={rest}
          onPress={(id) => router.push(`/canvas/${id}`)}
          onTogglePin={togglePin}
        />
      </ScrollView>

      <FAB onPress={createAndOpen} />
    </View>
  );
}

function Section({
  title,
  canvases,
  onPress,
  onTogglePin,
}: {
  title?: string;
  canvases: Canvas[];
  onPress: (id: string) => void;
  onTogglePin: (canvas: Canvas) => void;
}) {
  const { colors } = useTheme();
  if (canvases.length === 0) return null;

  return (
    <View>
      {title && (
        <ThemeText variant="subheading" className="px-5 pb-2 pt-4">
          {title}
        </ThemeText>
      )}
      {canvases.map((canvas) => (
        // Swipe to pin, the same gesture notes and tasks use — so the affordance transfers
        // rather than being something new to learn on this one screen. Archive and delete
        // live in the editor's menu, matching where the note editor keeps them.
        <SwipeablePinWrapper
          key={canvas.id}
          isPinned={!!canvas.pinned}
          onTogglePin={() => onTogglePin(canvas)}
        >
          <Pressable
            onPress={() => onPress(canvas.id)}
            className="border-b border-theme-line bg-theme-bg px-5 py-4"
            android_ripple={{ color: colors.paper2 }}
          >
            <ThemeText variant="title">{canvas.title || 'untitled'}</ThemeText>
            {/* A date rather than a thumbnail: rendering every scene to list a handful of
                titles is exactly what keeping scenes out of the metadata read avoids. */}
            <ThemeText variant="meta" className="mt-1">
              edited {formatEdited(canvas.updatedAt)}
            </ThemeText>
          </Pressable>
        </SwipeablePinWrapper>
      ))}
    </View>
  );
}

// Canvas is the first entity with a real updatedAt, so there's no shared helper to reuse —
// Note's date/time are display strings frozen at creation.
function formatEdited(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'never';
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
