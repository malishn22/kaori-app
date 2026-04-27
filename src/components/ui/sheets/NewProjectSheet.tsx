import React, { useState, useRef } from 'react';
import { View, TextInput as RNTextInput } from 'react-native';
import { FONT } from '@/theme';
import { useHapticFeedback } from '@/hooks';
import { useStore } from '@/providers/StoreProvider';
import { useNewProjectSheet } from '@/providers/NewProjectSheetProvider';
import { BottomSheet } from './BottomSheet';
import { SheetButtonRow } from './SheetButtonRow';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { Underline } from '../primitives/Underline';
import { ThemeText } from '../primitives/ThemeText';
import { CountedInput } from '../primitives/CountedInput';
import { SectionTitle } from '../primitives/SectionTitle';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { Divider } from '../primitives/Divider';
import { PROJECT_COLORS, SHEET_PADDING_H } from '@/constants';

export function NewProjectSheet() {
  const { impactOnSave } = useHapticFeedback();
  const { addProject } = useStore();
  const { bottomSheetRef, closeNewProject } = useNewProjectSheet();
  const textInputRef = useRef<RNTextInput>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  async function handleCreate() {
    if (!name.trim()) return;
    await addProject(name.trim(), selectedColor, '');
    impactOnSave();
    setName('');
    setSelectedColor(PROJECT_COLORS[0]);
    closeNewProject();
  }

  return (
    <BottomSheet
      sheetRef={bottomSheetRef}
      onChange={(index) => {
        if (index === 0) setTimeout(() => textInputRef.current?.focus(), 100);
      }}
    >
      <View style={{ paddingHorizontal: SHEET_PADDING_H, paddingTop: 8, overflow: 'hidden' }}>
        <GrainOverlay />

        <SectionTitle size={28} lineHeight={32} showUnderline={false}>a new project</SectionTitle>
        <Underline width={116} />

        {/* Name input */}
        <ThemeText variant="meta" style={{ marginTop: 18, marginBottom: 6, fontFamily: FONT.kalam }} color="ink3">name</ThemeText>
        <CountedInput
          asBottomSheet
          ref={textInputRef}
          placeholder="project name..."
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        {/* Color picker */}
        <ThemeText variant="meta" style={{ marginTop: 18, marginBottom: 10, fontFamily: FONT.kalam }} color="ink3">color</ThemeText>
        <ColorSwatchPicker selectedColor={selectedColor} onSelect={setSelectedColor} />

        <Divider marginHorizontal={-SHEET_PADDING_H} style={{ marginTop: 20, marginBottom: 14 }} />

        {/* Buttons */}
        <SheetButtonRow
          onCancel={closeNewProject}
          onAction={handleCreate}
          actionLabel="create project"
          actionDisabled={!name.trim()}
        />
      </View>
    </BottomSheet>
  );
}
