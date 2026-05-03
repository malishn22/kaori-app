import type { ViewStyle } from 'react-native';

// Semantic colors used outside the theme system
export const BUTTON_TEXT_ON_ACCENT = '#1a140a';
export const DELETE_COLOR = '#c97060';

// Shadow presets
export const SHADOW_CARD: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 14,
  elevation: 6,
};

export const SHADOW_POPUP: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 12,
};

export const SHADOW_EMPTY: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 16 },
  shadowOpacity: 0.4,
  shadowRadius: 40,
  elevation: 12,
};

// Color swatch button
export function colorSwatchStyle(color: string, isSelected: boolean): ViewStyle {
  return {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: isSelected ? 2 : 0,
    borderColor: isSelected ? `${color}88` : 'transparent',
  };
}

// Button dimensions
export const BUTTON_HEIGHT = 48;
export const BUTTON_RADIUS = 14;

// Animation durations (ms)
export const ANIM_POPUP_OPEN = 160;
export const ANIM_POPUP_CLOSE = 130;

// Popup dimensions
export const POPUP_WIDTH = 220;

// Time constants
export const MS_PER_DAY = 86_400_000;

// Layout spacing
export const SCREEN_PADDING_H = 24;
export const SHEET_PADDING_H = 22;
export const CARD_LIST_PADDING_H = 18;
