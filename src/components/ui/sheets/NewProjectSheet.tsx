import React, { useState, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { useHapticFeedback } from '@/hooks';
import { useStore } from '@/providers/StoreProvider';
import { useNewProjectSheet } from '@/providers/NewProjectSheetProvider';
import { BottomSheet } from './BottomSheet';
import { Underline } from '../primitives/Underline';
import { ThemeText } from '../primitives/ThemeText';
import { TextInput } from '../primitives/TextInput';
import { SectionLabel } from '../primitives/SectionLabel';
import { GrainOverlay } from '../primitives/GrainOverlay';
import { CheckIcon, ArrowIcon } from '@/assets/icons';
import { FONT } from '@/theme';
import { PROJECT_COLORS } from '@/constants';

export function NewProjectSheet() {
  const { colors } = useTheme();
  const { impactOnSave } = useHapticFeedback();
  const { addProject } = useStore();
  const { bottomSheetRef, closeNewProject } = useNewProjectSheet();
  const textInputRef = useRef<any>(null);
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
      <View style={{ paddingHorizontal: 22, paddingTop: 8, overflow: 'hidden' }}>
        <GrainOverlay />

        <SectionLabel size={28} lineHeight={32}>a new project</SectionLabel>
        <Underline width={116} />

        {/* Name input */}
        <ThemeText variant="meta" style={{ marginTop: 18, marginBottom: 6, fontFamily: FONT.kalam }} color="ink3">name</ThemeText>
        <TextInput
          asBottomSheet
          ref={textInputRef}
          placeholder="project name..."
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        {/* Color picker */}
        <ThemeText variant="meta" style={{ marginTop: 18, marginBottom: 10, fontFamily: FONT.kalam }} color="ink3">color</ThemeText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PROJECT_COLORS.map((color) => {
            const isSelected = selectedColor === color;
            return (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                activeOpacity={0.8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: color,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: isSelected ? `${color}88` : 'transparent',
                }}
              >
                {isSelected && <CheckIcon size={14} color="#1a140a" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: -22, marginTop: 20, marginBottom: 14 }} />

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={closeNewProject}
            style={{
              flex: 1, height: 48, borderRadius: 14,
              borderWidth: 1, borderColor: colors.line2,
              alignItems: 'center', justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <ThemeText variant="label" size={14} color="ink2" style={{ fontFamily: FONT.geistMedium }}>cancel</ThemeText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!name.trim()}
            style={{
              flex: 2, height: 48, borderRadius: 14,
              backgroundColor: colors.amber,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: name.trim() ? 1 : 0.4,
            }}
            activeOpacity={0.85}
          >
            <ThemeText variant="button" color="#1a140a">create project</ThemeText>
            <ArrowIcon size={16} color="#1a140a" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
