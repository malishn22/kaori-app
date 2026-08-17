import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CanvasTool } from 'kaori-core';
import { useTheme } from '@/theme';
import {
  ArrowIcon,
  CursorIcon,
  EllipseIcon,
  EraserIcon,
  FrameIcon,
  HandIcon,
  LineIcon,
  ScribbleIcon,
  SquareIcon,
  TextIcon,
} from './toolIcons';

// The tool strip. Desktop puts this along the top with keyboard-shortcut badges; on a phone
// it belongs at the bottom within thumb reach, and the badges are dropped — there is no
// keyboard to hint at.
//
// One row of evenly-spread buttons rather than a horizontal scroll: a toolbar that can hide
// its own tools is a toolbar you have to hunt through, and these fit across a phone at this
// size.
//
// `image` is still absent — it needs the picker, and a button that does nothing is worse than
// no button. It joins the row with its feature.
const TOOLS: { tool: CanvasTool; label: string; Icon: typeof CursorIcon }[] = [
  { tool: 'select', label: 'select', Icon: CursorIcon },
  { tool: 'hand', label: 'pan', Icon: HandIcon },
  { tool: 'draw', label: 'draw', Icon: ScribbleIcon },
  { tool: 'rect', label: 'rectangle', Icon: SquareIcon },
  { tool: 'ellipse', label: 'ellipse', Icon: EllipseIcon },
  { tool: 'line', label: 'line', Icon: LineIcon },
  { tool: 'arrow', label: 'arrow', Icon: ArrowIcon },
  { tool: 'text', label: 'text', Icon: TextIcon },
  { tool: 'frame', label: 'frame', Icon: FrameIcon },
  { tool: 'eraser', label: 'eraser', Icon: EraserIcon },
];

export function CanvasToolbar({
  tool,
  onSelect,
}: {
  tool: CanvasTool;
  onSelect: (tool: CanvasTool) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-around border-t border-theme-line bg-theme-bg px-1 pt-2"
      // The FULL bottom inset, not the clamped one the tab bar uses. AndroidNavBarFill in
      // app/_layout.tsx paints an opaque band over the bottom `insets.bottom` pixels at
      // zIndex 50; the tab bar escapes it by being absolutely positioned at bottom: 8 and
      // 72px tall, but this bar sits in normal flow at the very bottom, so clamping the
      // inset put the buttons underneath that band and hid them.
      style={{ paddingBottom: insets.bottom + 10 }}
    >
      {TOOLS.map(({ tool: t, label, Icon }) => {
        const active = tool === t;
        return (
          <Pressable
            key={t}
            onPress={() => onSelect(t)}
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            // Nine buttons have to fit across a narrow phone, so the pill is smaller than the
            // 44pt minimum and hitSlop makes up the difference — the tappable area is ~48pt
            // even though the drawn pill is 36.
            hitSlop={6}
            // A filled pill behind the active tool. Colour alone is too weak a signal at
            // this size, especially for the single-stroke glyphs.
            className="items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              backgroundColor: active ? colors.paper2 : 'transparent',
            }}
          >
            <Icon size={20} color={active ? colors.amber : colors.ink3} />
          </Pressable>
        );
      })}
    </View>
  );
}
