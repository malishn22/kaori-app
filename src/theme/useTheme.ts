import { useSettings } from '@/providers/SettingsProvider';
import { getColors } from './colors';

export function useTheme() {
  const { settings, setSetting } = useSettings();
  const colors = getColors(settings.tone, settings.accent);
  return { colors, settings, setSetting };
}
