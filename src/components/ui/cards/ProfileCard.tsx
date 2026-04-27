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
    <View style={{
      backgroundColor: colors.paper,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.line,
      transform: [{ rotate: '-0.4deg' }],
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <GrainOverlay />

      <LinearGradient
        colors={[colors.amber, colors.ink3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
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
