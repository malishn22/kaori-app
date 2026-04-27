import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { BackIcon, SettingsIcon } from '@/assets/icons';
import { ThemeText } from '../primitives/ThemeText';
import { HeaderText } from '../primitives/HeaderText';
import { Underline } from '../primitives/Underline';

type HeaderAction = { icon: React.ReactNode; onPress?: () => void };

type PageHeaderProps = {
  onBack?: () => void;
  settingsButton?: boolean;
  rightActions?: HeaderAction[];
  caption?: string;
  title?: string;
  subtitle?: string;
  underlineWidth?: number;
};

export function PageHeader({ onBack, settingsButton, rightActions = [], caption, title, subtitle, underlineWidth = 92 }: PageHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const hasNavBar = onBack || rightActions.length > 0;

  return (
    <View style={{ backgroundColor: colors.bg, paddingTop: insets.top + 16 }}>
      {/* Navigation bar (back button / right actions) */}
      {hasNavBar && (
        <View style={{
          height: 52,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}>
          {onBack && (
            <TouchableOpacity onPress={onBack} hitSlop={12} activeOpacity={0.7}>
              <BackIcon size={20} color={colors.ink2} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {rightActions.map((action, i) => (
            <TouchableOpacity key={i} onPress={action.onPress} hitSlop={12} activeOpacity={0.7} style={{ marginLeft: i > 0 ? 16 : 0 }}>
              {action.icon}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Settings button (absolutely positioned, doesn't take layout space) */}
      {settingsButton && (
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          hitSlop={12}
          activeOpacity={0.7}
          style={{ position: 'absolute', top: insets.top + 40, right: 24, zIndex: 1 }}
        >
          <SettingsIcon size={22} color={colors.ink2} strokeWidth={1.4} />
        </TouchableOpacity>
      )}

      {/* Title section */}
      {title && (
        <View style={{ paddingHorizontal: 24, paddingTop: hasNavBar ? 0 : 8 }}>
          {caption && (
            <ThemeText variant="caption" letterSpacing={0.6}>
              {caption}
            </ThemeText>
          )}
          <HeaderText style={{ marginTop: caption ? 6 : 0 }}>{title}</HeaderText>
          <Underline width={underlineWidth} />
          {subtitle && (
            <ThemeText variant="meta" color="ink2" style={{ marginTop: 6 }}>
              {subtitle}
            </ThemeText>
          )}
        </View>
      )}
    </View>
  );
}
