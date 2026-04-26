import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/theme';
import { useHapticFeedback } from '@/hooks';
import { useStore } from '@/providers/StoreProvider';
import { useNewNoteSheet } from '@/providers/NewNoteSheetProvider';
import { BottomSheet } from './BottomSheet';
import { Underline } from '../primitives/Underline';
import { ThemeText } from '../primitives/ThemeText';
import { Input } from '../primitives/Input';
import { Chip } from '../primitives/Chip';
import { SectionLabel } from '../primitives/SectionLabel';
import { ArrowIcon } from '@/assets/icons';
import { FONT } from '@/theme';
import { GrainOverlay } from '../primitives/GrainOverlay';

export function NewNoteSheet() {
  const { colors } = useTheme();
  const { impactOnSave } = useHapticFeedback();
  const { projects, addIdea } = useStore();
  const { bottomSheetRef, initialProjectId, resetKey, closeNewNote } = useNewNoteSheet();
  const textInputRef = useRef<any>(null);
  const [text, setText] = useState('');
  const [activeProject, setActiveProject] = useState<string | null>(
    initialProjectId ?? (projects.length > 0 ? projects[0].id : null)
  );

  useEffect(() => {
    setActiveProject(initialProjectId ?? (projects.length > 0 ? projects[0].id : null));
    setText('');
  }, [initialProjectId, resetKey]);

  async function handleSave() {
    if (!text.trim()) return;
    await addIdea(text.trim(), activeProject);
    impactOnSave();
    closeNewNote();
  }

  return (
    <BottomSheet sheetRef={bottomSheetRef} onChange={(index) => { if (index === 0) setTimeout(() => textInputRef.current?.focus(), 100); }}>
      <View style={{
        paddingHorizontal: 22,
        paddingTop: 8,
        overflow: 'hidden',
      }}>
        <GrainOverlay />

        <SectionLabel size={28} lineHeight={32}>a new note</SectionLabel>
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

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.line2, marginHorizontal: -22, marginTop: 18, marginBottom: 14 }} />

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
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={closeNewNote}
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
            onPress={handleSave}
            disabled={!text.trim()}
            style={{
              flex: 2, height: 48, borderRadius: 14,
              backgroundColor: colors.amber,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: text.trim() ? 1 : 0.4,
            }}
            activeOpacity={0.85}
          >
            <ThemeText variant="button" color="#1a140a">save it</ThemeText>
            <ArrowIcon size={16} color="#1a140a" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
