import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TextInput as RNTextInput } from 'react-native';
import { useHapticFeedback } from '@/hooks';
import { useStore } from '@/providers/StoreProvider';
import { useNewNoteSheet } from '@/providers/NewNoteSheetProvider';
import { BottomSheet } from './BottomSheet';
import { SheetButtonRow } from './SheetButtonRow';
import { Underline } from '../primitives/Underline';
import { ThemeText } from '../primitives/ThemeText';
import { Input } from '../primitives/Input';
import { Chip } from '../primitives/Chip';
import { SectionTitle } from '../primitives/SectionTitle';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { Divider } from '../primitives/Divider';
import { SHEET_PADDING_H } from '@/constants';

export function NewNoteSheet() {
  const { impactOnSave } = useHapticFeedback();
  const { projects, addNote } = useStore();
  const { bottomSheetRef, initialProjectId, resetKey, closeNewNote } = useNewNoteSheet();
  const textInputRef = useRef<RNTextInput>(null);
  const [text, setText] = useState('');
  const [activeProject, setActiveProject] = useState<string | null>(
    initialProjectId ?? null
  );

  useEffect(() => {
    setActiveProject(initialProjectId ?? null);
    setText('');
  }, [initialProjectId, resetKey]);

  async function handleSave() {
    if (!text.trim()) return;
    await addNote(text.trim(), activeProject);
    impactOnSave();
    closeNewNote();
  }

  return (
    <BottomSheet sheetRef={bottomSheetRef} onChange={(index) => { if (index === 0) setTimeout(() => textInputRef.current?.focus(), 100); }}>
      <View style={{
        paddingHorizontal: SHEET_PADDING_H,
        paddingTop: 8,
        overflow: 'hidden',
      }}>
        <GrainOverlay />

        <SectionTitle size={28} lineHeight={32} showUnderline={false}>a new note</SectionTitle>
        <Underline width={84} />

        {/* Text input */}
        <Input
          asBottomSheet
          style={{
            marginTop: 18,
            minHeight: 110,
            lineHeight: 25,
            textAlignVertical: 'top',
          }}
          placeholder="what's on your mind..."
          value={text}
          onChangeText={setText}
          ref={textInputRef}
          multiline
        />

        <Divider marginHorizontal={-SHEET_PADDING_H} style={{ marginTop: 18, marginBottom: 14 }} />

        {/* Project chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip active={activeProject === null} onPress={() => setActiveProject(null)} paddingVertical={7}>
              <ThemeText variant="chip" color={activeProject === null ? 'ink' : 'ink2'}>none</ThemeText>
            </Chip>
            {projects.map(chip => {
              const isActive = activeProject === chip.id;
              return (
                <Chip key={chip.id} color={chip.color} active={isActive} dot dotSize={6} onPress={() => setActiveProject(chip.id)} paddingVertical={7}>
                  <ThemeText variant="chip" color={isActive ? chip.color : 'ink2'}>{chip.name}</ThemeText>
                </Chip>
              );
            })}
          </View>
        </ScrollView>

        {/* Buttons */}
        <SheetButtonRow
          onCancel={closeNewNote}
          onAction={handleSave}
          actionLabel="save it"
          actionDisabled={!text.trim()}
        />
      </View>
    </BottomSheet>
  );
}
