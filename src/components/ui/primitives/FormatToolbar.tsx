import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import {
  CircleIcon,
  DotLineIcon,
  NumberedListIcon,
  StrikethroughIcon,
  MicIcon,
} from '@/assets/icons';
import { ConfirmationDialog } from './ConfirmationDialog';

type Props = {
  onCheckbox: () => void;
  onDotted: () => void;
  onNumbered: () => void;
  onStrikethrough: () => void;
  onMic: () => void;
  isListening: boolean;
  isMicAvailable: boolean;
};

export function FormatToolbar({
  onCheckbox,
  onDotted,
  onNumbered,
  onStrikethrough,
  onMic,
  isListening,
  isMicAvailable,
}: Props) {
  const { colors } = useTheme();
  const [showUnavailable, setShowUnavailable] = useState(false);

  function handleMicPress() {
    if (!isMicAvailable) {
      setShowUnavailable(true);
      return;
    }
    onMic();
  }

  return (
    <View className="flex-row items-center h-[46px] px-2 border-t border-theme-line bg-theme-bg">
      <TouchableOpacity
        onPress={handleMicPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-9 items-center justify-center rounded-full border"
        activeOpacity={0.6}
        style={{
          borderColor: isListening ? colors.amber : colors.line2,
          backgroundColor: isListening ? `${colors.amber}22` : 'transparent',
        }}
      >
        <MicIcon size={18} color={colors.amber} />
      </TouchableOpacity>

      <View className="w-px h-6 mx-2" style={{ backgroundColor: colors.line2 }} />

      <TouchableOpacity
        onPress={onCheckbox}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-10 items-center justify-center"
        activeOpacity={0.6}
      >
        <CircleIcon size={22} color={colors.amber} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDotted}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-10 items-center justify-center"
        activeOpacity={0.6}
      >
        <DotLineIcon size={20} color={colors.amber} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNumbered}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-10 items-center justify-center"
        activeOpacity={0.6}
      >
        <NumberedListIcon size={20} color={colors.amber} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onStrikethrough}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="size-10 items-center justify-center"
        activeOpacity={0.6}
      >
        <StrikethroughIcon size={16} color={colors.amber} />
      </TouchableOpacity>

      <ConfirmationDialog
        visible={showUnavailable}
        title="dictation unavailable"
        subtitle="voice input needs the full Kaori app build, not Expo Go."
        actions={[{ label: 'got it', onPress: () => setShowUnavailable(false) }]}
        onClose={() => setShowUnavailable(false)}
      />
    </View>
  );
}
