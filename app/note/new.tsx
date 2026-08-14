import React, { useState, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback, useActiveFolders, useSpeechToText } from '@/hooks';
import {
  PageHeader,
  ThemeText,
  FolderChipSelector,
  FormatToolbar,
  EditorScreen,
  TextContent,
  type TextContentHandle,
} from '@/components/ui';
import { BUTTON_TEXT_ON_ACCENT } from '@/constants';

export default function NewNoteScreen() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const { addNote } = useStore();
  const folders = useActiveFolders();
  const { impactOnSave } = useHapticFeedback();

  const [text, setText] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderId ?? null);
  const editorRef = useRef<TextContentHandle>(null);

  const { isListening, isAvailable, start, stop } = useSpeechToText({
    onTranscript: (transcript, isFinal) => editorRef.current?.updateDictation(transcript, isFinal),
  });

  function handleMic() {
    if (isListening) {
      stop();
    } else {
      editorRef.current?.beginDictation();
      start();
    }
  }

  async function handleSave() {
    if (!text.trim()) return;
    await addNote(text.trim(), selectedFolder);
    impactOnSave();
    router.back();
  }

  return (
    <View className="flex-1 bg-theme-bg">
      <PageHeader onBack={() => router.back()} />
      <EditorScreen
        toolbar={
          <FormatToolbar
            onCheckbox={() => editorRef.current?.insertCheckbox()}
            onDotted={() => editorRef.current?.insertDotted()}
            onNumbered={() => editorRef.current?.insertNumbered()}
            onStrikethrough={() => editorRef.current?.wrapStrikethrough()}
            onMic={handleMic}
            isListening={isListening}
            isMicAvailable={isAvailable}
          />
        }
      >
        <View className="px-6 pt-3">
          <TextContent
            ref={editorRef}
            text=""
            links={{}}
            editing
            draft={text}
            onDraftChange={setText}
            onCheckboxToggle={() => {}}
            placeholder="what's on your mind..."
          />

          <FolderChipSelector
            folders={folders}
            selected={selectedFolder}
            onSelect={setSelectedFolder}
            label="folder"
          />
        </View>

        <View className="px-4 pt-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={!text.trim()}
            className="h-[52px] rounded-2xl bg-theme-amber items-center justify-center"
            style={{ opacity: text.trim() ? 1 : 0.4 }}
            activeOpacity={0.85}
          >
            <ThemeText variant="button" color={BUTTON_TEXT_ON_ACCENT}>
              save note
            </ThemeText>
          </TouchableOpacity>
        </View>
      </EditorScreen>
    </View>
  );
}
