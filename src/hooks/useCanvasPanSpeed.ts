import { useCallback, useEffect, useState } from 'react';
import { safeGet, safeSet } from '@/utils/storage';

const KEY = '@kaori_canvas_pan_speed';

export const PAN_SPEED_MIN = 0.5;
export const PAN_SPEED_MAX = 3;
export const PAN_SPEED_DEFAULT = 1.5;

// How far the canvas travels per point of finger movement. A preference rather than a
// constant because "right" depends on the phone and the hand: the same multiplier that feels
// natural on a small screen is twitchy on a large one.
//
// Its own key rather than a field in SettingsProvider — that provider is the app's theme
// settings, and this is a canvas control that nothing else reads.
export function useCanvasPanSpeed() {
  const [panSpeed, setPanSpeedState] = useState(PAN_SPEED_DEFAULT);

  useEffect(() => {
    void safeGet(KEY).then((raw) => {
      if (!raw) return;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        setPanSpeedState(Math.min(PAN_SPEED_MAX, Math.max(PAN_SPEED_MIN, parsed)));
      }
    });
  }, []);

  const setPanSpeed = useCallback((next: number) => {
    const clamped = Math.min(PAN_SPEED_MAX, Math.max(PAN_SPEED_MIN, next));
    setPanSpeedState(clamped);
    void safeSet(KEY, String(clamped));
  }, []);

  return { panSpeed, setPanSpeed };
}
