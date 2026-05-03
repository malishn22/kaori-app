import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { ThemeText } from '../primitives/ThemeText';
import { HeaderText } from '../primitives/HeaderText';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { PageHeader } from './PageHeader';
import { FAB } from './FAB';
import { SHADOW_EMPTY } from '@/constants';

type Props = {
  variant: 'notes' | 'tasks';
  onFAB: () => void;
};

const NOTE_LINES = [0.6, 0.85, 0.4, 0.7, 0.55];
const TASK_LINES = [0.6, 0.75, 0.5, 0.65, 0.45];

export function EmptyState({ variant, onFAB }: Props) {
  const { colors } = useTheme();
  const isNotes = variant === 'notes';

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader settingsButton />
      <View className="flex-1 items-center px-8 pt-20">
        <View
          className="bg-theme-paper rounded-[14px] border border-theme-line2 overflow-hidden mb-8"
          style={{ width: 220, height: 280, transform: [{ rotate: '-3deg' }], ...SHADOW_EMPTY }}
        >
          {isNotes
            ? NOTE_LINES.map((w, i) => (
                <View key={i} className="absolute h-px bg-theme-line2" style={{
                  top: 24 + i * 34,
                  left: 22,
                  width: `${w * 100}%` as any,
                }} />
              ))
            : TASK_LINES.map((w, i) => (
                <View key={i} className="absolute flex-row items-center gap-2.5" style={{
                  top: 24 + i * 42,
                  left: 22,
                }}>
                  <View className="size-3.5 rounded border-[1.2px] border-theme-line2" />
                  <View className="h-px bg-theme-line2" style={{
                    width: `${w * 100}%` as any,
                  }} />
                </View>
              ))
          }
          <ThemeText variant="heading" size={28} color="amber" style={{
            position: 'absolute', bottom: 28, right: 28,
            opacity: 0.35,
            transform: [{ rotate: '-8deg' }],
          }}>—</ThemeText>
        </View>

        <HeaderText size={32} lineHeight={38} style={{ textAlign: 'center' }}>
          {isNotes ? 'notebook' : 'tasks'}
        </HeaderText>
        <HeaderText size={32} lineHeight={38} color="amber" style={{ textAlign: 'center' }}>empty</HeaderText>
      </View>
      <FAB onPress={onFAB} wide label={isNotes ? 'first note' : 'first task'} />
    </View>
  );
}
