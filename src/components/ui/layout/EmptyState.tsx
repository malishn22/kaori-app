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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader settingsButton />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 80 }}>
        <View style={{
          width: 220, height: 280,
          backgroundColor: colors.paper,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.line2,
          transform: [{ rotate: '-3deg' }],
          ...SHADOW_EMPTY,
          overflow: 'hidden',
          marginBottom: 32,
        }}>
          {isNotes
            ? NOTE_LINES.map((w, i) => (
                <View key={i} style={{
                  position: 'absolute',
                  top: 24 + i * 34,
                  left: 22,
                  width: `${w * 100}%` as any,
                  height: 1,
                  backgroundColor: colors.line2,
                }} />
              ))
            : TASK_LINES.map((w, i) => (
                <View key={i} style={{
                  position: 'absolute',
                  top: 24 + i * 42,
                  left: 22,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <View style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    borderWidth: 1.2,
                    borderColor: colors.line2,
                  }} />
                  <View style={{
                    width: `${w * 100}%` as any,
                    height: 1,
                    backgroundColor: colors.line2,
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
