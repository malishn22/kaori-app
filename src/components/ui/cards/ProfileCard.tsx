import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { ThemeText } from '../primitives/ThemeText';
import { HeaderText } from '../primitives/HeaderText';
import { CountedInput } from '../primitives/CountedInput';

type ProfileCardProps = {
  initial: string;
  name: string;
  editing: boolean;
  draft: string;
  onChangeDraft: (v: string) => void;
  onStartEditing: () => void;
  onCommitEdit: () => void;
};

export function ProfileCard({ initial, name, editing, draft, onChangeDraft, onStartEditing, onCommitEdit }: ProfileCardProps) {
  const { colors } = useTheme();

  return (
    <View
      className="bg-theme-paper rounded-[20px] p-6 border border-theme-line items-center overflow-hidden mb-4"
      style={{ transform: [{ rotate: '-0.4deg' }] }}
    >
      <GrainOverlay />

      <LinearGradient
        colors={[colors.amber, colors.ink3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="size-20 rounded-[20px] items-center justify-center mb-4"
      >
        <ThemeText variant="heading" size={36} color="bg">{initial}</ThemeText>
      </LinearGradient>

      {editing ? (
        <CountedInput
          value={draft}
          onChangeText={onChangeDraft}
          maxLength={30}
          autoFocus
          onBlur={onCommitEdit}
          onSubmitEditing={onCommitEdit}
          returnKeyType="done"
        />
      ) : (
        <TouchableOpacity onPress={onStartEditing} activeOpacity={0.7}>
          <HeaderText size={26} lineHeight={32}>{name}</HeaderText>
        </TouchableOpacity>
      )}

      {!editing && (
        <ThemeText variant="meta" color="ink4" style={{ marginTop: 6 }}>tap your name to rename</ThemeText>
      )}
    </View>
  );
}
