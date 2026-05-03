import '../global.css';
import { Kalam_700Bold, useFonts as useKalamFonts } from '@expo-google-fonts/kalam';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { useFonts } from 'expo-font';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme, getColors, themeVars } from '@/theme';
import { SettingsProvider, useSettings } from '@/providers/SettingsProvider';
import { StoreProvider, useStore } from '@/providers/StoreProvider';
import { SettingSheetProvider, useSettingSheet } from '@/providers/SettingSheetProvider';
import { SettingSheet } from '@/components/ui';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TONE_OPTIONS, ACCENT_OPTIONS } from '@/constants/options';

function AndroidNavBarFill() {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'android' || insets.bottom === 0) return null;
  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-theme-bg"
      style={{ height: insets.bottom, zIndex: 50 }}
    />
  );
}

function ThemeVarsRoot({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  return (
    <View style={[{ flex: 1 }, themeVars(settings.tone, settings.accent)]}>
      {children}
    </View>
  );
}

function RootSettingSheets() {
  const { settings, setSetting } = useTheme();
  const { folders, profile, updateProfile } = useStore();
  const { openSheet, setOpenSheet } = useSettingSheet();
  const folderOptions = folders.map(f => ({ value: f.id, label: f.name }));

  return (
    <>
      <SettingSheet
        visible={openSheet === 'tone'}
        title="theme"
        options={TONE_OPTIONS}
        value={settings.tone}
        onSelect={(v) => setSetting('tone', v)}
        onClose={() => setOpenSheet(null)}
      />
      <SettingSheet
        visible={openSheet === 'accent'}
        title="accent"
        options={ACCENT_OPTIONS}
        value={settings.accent}
        onSelect={(v) => setSetting('accent', v)}
        onClose={() => setOpenSheet(null)}
      />
      <SettingSheet
        visible={openSheet === 'folder'}
        title="default folder"
        options={folderOptions}
        value={profile.defaultFolder}
        onSelect={(v) => { updateProfile({ defaultFolder: v }); setOpenSheet(null); }}
        onClose={() => setOpenSheet(null)}
      />
    </>
  );
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [kalamLoaded] = useKalamFonts({ Kalam_700Bold });
  const [geistLoaded] = useFonts({
    'Geist-Regular': require('../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../assets/fonts/Geist-Medium.ttf'),
    'Geist-Bold': require('../assets/fonts/Geist-Bold.ttf'),
  });

  const loaded = kalamLoaded && geistLoaded;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: getColors().bg }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ThemeVarsRoot>
            <StoreProvider>
              <SettingSheetProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: getColors().bg } }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="folder/[id]" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="folder/new" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="note/[id]" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="note/new" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="task/new" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="task/[id]" options={{ animation: 'slide_from_right' }} />
                </Stack>
                <RootSettingSheets />
                <AndroidNavBarFill />
              </SettingSheetProvider>
            </StoreProvider>
          </ThemeVarsRoot>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
