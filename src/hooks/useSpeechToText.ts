import { useEffect, useRef, useState } from 'react';
import { IS_EXPO_GO } from '@/utils/notifications';
import { useHapticFeedback } from './useHapticFeedback';

// Lazily require the native speech module so it never loads in Expo Go,
// where it isn't linked and throws at import time.
function Speech() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-speech-recognition') as typeof import('expo-speech-recognition');
}

type Options = {
  onTranscript: (transcript: string, isFinal: boolean) => void;
};

export function useSpeechToText({ onTranscript }: Options) {
  const { notificationWarning } = useHapticFeedback();
  const [isListening, setIsListening] = useState(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  // Tracks whether stop() was called by the user, vs. the native session
  // ending on its own (e.g. a silence timeout) — see the 'end' listener below.
  const stoppedByUserRef = useRef(false);

  useEffect(() => {
    if (IS_EXPO_GO) return;
    const { ExpoSpeechRecognitionModule } = Speech();

    const subscriptions = [
      ExpoSpeechRecognitionModule.addListener('result', (event) => {
        const transcript = event.results[0]?.transcript ?? '';
        onTranscriptRef.current(transcript, event.isFinal);
      }),
      ExpoSpeechRecognitionModule.addListener('end', () => {
        if (stoppedByUserRef.current) {
          setIsListening(false);
          return;
        }
        // The recognizer ended itself while the user was still dictating —
        // resume immediately so a pause never drops them out of recording.
        ExpoSpeechRecognitionModule.start({ interimResults: true, continuous: true });
      }),
      ExpoSpeechRecognitionModule.addListener('error', () => {
        stoppedByUserRef.current = true;
        setIsListening(false);
        notificationWarning();
      }),
    ];

    return () => subscriptions.forEach((sub) => sub.remove());
  }, [notificationWarning]);

  async function start() {
    if (IS_EXPO_GO) return;
    const { ExpoSpeechRecognitionModule } = Speech();

    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      notificationWarning();
      return;
    }

    stoppedByUserRef.current = false;
    setIsListening(true);
    ExpoSpeechRecognitionModule.start({ interimResults: true, continuous: true });
  }

  function stop() {
    if (IS_EXPO_GO) return;
    stoppedByUserRef.current = true;
    Speech().ExpoSpeechRecognitionModule.stop();
  }

  return { isListening, isAvailable: !IS_EXPO_GO, start, stop };
}
