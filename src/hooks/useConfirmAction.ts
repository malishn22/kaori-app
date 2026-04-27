import { useState, useCallback } from 'react';

type UseConfirmActionOptions = {
  onConfirm: () => void | Promise<void>;
  onHaptic?: () => void;
};

export function useConfirmAction({ onConfirm, onHaptic }: UseConfirmActionOptions) {
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const handlePress = useCallback(async () => {
    if (!needsConfirm) {
      setNeedsConfirm(true);
      return;
    }
    onHaptic?.();
    await onConfirm();
  }, [needsConfirm, onConfirm, onHaptic]);

  const reset = useCallback(() => {
    setNeedsConfirm(false);
  }, []);

  return { needsConfirm, handlePress, reset };
}
