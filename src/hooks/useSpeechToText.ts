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

  useEffect(() => {
    if (IS_EXPO_GO) return;
    const { ExpoSpeechRecognitionModule } = Speech();

    const subscriptions = [
      ExpoSpeechRecognitionModule.addListener('result', (event) => {
        const transcript = event.results[0]?.transcript ?? '';
        onTranscriptRef.current(transcript, event.isFinal);
      }),
      ExpoSpeechRecognitionModule.addListener('end', () => setIsListening(false)),
      ExpoSpeechRecognitionModule.addListener('error', () => {
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

    setIsListening(true);
    ExpoSpeechRecognitionModule.start({ interimResults: true, continuous: true });
  }

  function stop() {
    if (IS_EXPO_GO) return;
    Speech().ExpoSpeechRecognitionModule.stop();
  }

  return { isListening, isAvailable: !IS_EXPO_GO, start, stop };
}
