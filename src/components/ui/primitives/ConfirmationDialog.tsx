import React from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/theme';
import { resolveColor } from '@/theme/colors';
import { ThemeText } from './ThemeText';
import { GrainOverlay } from './GrainOverlay';
import { Divider } from './Divider';

export type DialogAction = {
  label: string;
  color?: string;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  actions: DialogAction[];
  onClose: () => void;
};

export function ConfirmationDialog({ visible, title, subtitle, actions, onClose }: Props) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            width: '78%',
            backgroundColor: colors.paper,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.line2,
            overflow: 'hidden',
          }}
        >
          <GrainOverlay />

          {/* Header */}
          <View style={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: subtitle ? 4 : 14 }}>
            <ThemeText variant="title">{title}</ThemeText>
            {subtitle && (
              <ThemeText variant="meta" style={{ marginTop: 4 }}>{subtitle}</ThemeText>
            )}
          </View>

          <Divider />

          {/* Actions */}
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              onPress={action.onPress}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 14,
                borderBottomWidth: i < actions.length - 1 ? 1 : 0,
                borderBottomColor: colors.line,
              }}
            >
              <ThemeText variant="body" color={resolveColor(action.color, colors) ?? colors.ink}>
                {action.label}
              </ThemeText>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
