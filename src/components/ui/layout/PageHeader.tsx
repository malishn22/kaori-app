import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { BackIcon, SettingsIcon, EditIcon, MoreIcon } from '@/assets/icons';
import { ThemeText } from '../primitives/ThemeText';
import { HeaderText } from '../primitives/HeaderText';
import { Underline } from '../primitives/Underline';

type PageHeaderProps = {
  onBack?: () => void;
  settingsButton?: boolean;
  editButton?: { onPress: () => void; active?: boolean };
  moreButton?: { onPress: () => void };
  caption?: string;
  title?: string;
  subtitle?: string;
  underlineWidth?: number;
  titleElement?: React.ReactNode;
};

export function PageHeader({ onBack, settingsButton, editButton, moreButton, caption, title, subtitle, underlineWidth = 92, titleElement }: PageHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const hasNavBar = onBack || editButton || moreButton;
  const hasTitleSection = titleElement || title;

  return (
    <View className="bg-theme-bg" style={{ paddingTop: insets.top + 16 }}>
      {/* Navigation bar (back, edit, more) */}
      {hasNavBar && (
        <View className="h-[52px] px-4 flex-row items-center gap-1.5">
          {onBack && (
            <TouchableOpacity onPress={onBack} hitSlop={12} activeOpacity={0.7}>
              <BackIcon size={20} color={colors.ink2} />
            </TouchableOpacity>
          )}
          <View className="flex-1" />
          {editButton && (
            <TouchableOpacity onPress={editButton.onPress} hitSlop={12} activeOpacity={0.7}>
              <EditIcon size={24} color={editButton.active ? colors.amber : colors.ink2} />
            </TouchableOpacity>
          )}
          {moreButton && (
            <TouchableOpacity onPress={moreButton.onPress} hitSlop={12} activeOpacity={0.7} style={{ marginLeft: editButton ? 16 : 0 }}>
              <MoreIcon size={26} color={colors.ink2} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Settings button fallback (when no title section, e.g. empty state) */}
      {settingsButton && !hasTitleSection && (
        <View className="flex-row justify-end px-6 pt-2">
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <SettingsIcon size={22} color={colors.ink2} strokeWidth={1.4} />
          </TouchableOpacity>
        </View>
      )}

      {/* Title section */}
      {hasTitleSection && (
        <View className="px-6 gap-1.5" style={{ paddingTop: hasNavBar ? 0 : 8 }}>
          {caption && (
            <ThemeText variant="caption" letterSpacing={0.6}>{caption}</ThemeText>
          )}
          <View className="flex-row items-center justify-between">
            {titleElement ?? <HeaderText>{title}</HeaderText>}
            {settingsButton && (
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                hitSlop={12}
                activeOpacity={0.7}
              >
                <SettingsIcon size={22} color={colors.ink2} strokeWidth={1.4} />
              </TouchableOpacity>
            )}
          </View>
          <Underline width={underlineWidth} />
          {subtitle && (
            <ThemeText variant="meta" color="ink2">{subtitle}</ThemeText>
          )}
        </View>
      )}
    </View>
  );
}
