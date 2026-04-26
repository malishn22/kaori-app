import { useRef, useEffect } from 'react';
import GorhomBottomSheet from '@gorhom/bottom-sheet';

export function useBottomSheetControl(visible: boolean) {
  const sheetRef = useRef<GorhomBottomSheet>(null);

  useEffect(() => {
    if (visible) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [visible]);

  return sheetRef;
}
