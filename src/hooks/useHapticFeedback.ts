import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';

export function useHapticFeedback() {
  const { settings } = useTheme();

  // Respects hapticOnSave setting — use for save actions
  function impactOnSave(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) {
    if (settings.hapticOnSave) {
      Haptics.impactAsync(style);
    }
  }

  // Always fires — use for non-save interactions
  function impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    Haptics.impactAsync(style);
  }

  function notificationWarning() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  return { impactOnSave, impact, notificationWarning };
}
