import React from 'react';
import { Platform } from 'react-native';
import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

type BottomSheetProps = {
  sheetRef: React.RefObject<GorhomBottomSheet | null>;
  children: React.ReactNode;
  onChange?: (index: number) => void;
};

export function BottomSheet({ sheetRef, children, onChange }: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? Math.min(insets.bottom, 12) : insets.bottom;

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      backgroundStyle={{
        backgroundColor: colors.paper,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        borderWidth: 1,
        borderColor: colors.line2,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.ink4, width: 40 }}
      onChange={onChange}
    >
      <BottomSheetView style={{ paddingBottom: 44 + bottomInset }}>
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
}
