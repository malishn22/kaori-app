import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, Linking, type TextStyle } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { FormattedText } from './FormattedText';
import { ConfirmationDialog } from './ConfirmationDialog';
import {
  insertCheckboxAtCursor,
  insertDottedAtCursor,
  insertNumberedAtCursor,
  wrapStrikethrough,
  toggleCheckboxLine,
  replaceRange,
} from '@/utils/noteFormat';
import { getDomain } from '@/utils/links';

export type TextContentHandle = {
  insertCheckbox: () => void;
  insertDotted: () => void;
  insertNumbered: () => void;
  wrapStrikethrough: () => void;
  beginDictation: () => void;
  updateDictation: (transcript: string, isFinal: boolean) => void;
};

type Props = {
  text: string;
  links: Record<string, string>;
  editing: boolean;
  draft: string;
  onDraftChange: (next: string) => void;
  onCheckboxToggle: (nextText: string) => void;
  textStyle?: TextStyle;
  placeholder?: string;
};

export const TextContent = forwardRef<TextContentHandle, Props>(function TextContent(
  { text, links, editing, draft, onDraftChange, onCheckboxToggle, textStyle, placeholder },
  ref,
) {
  const { colors } = useTheme();
  const selectionRef = useRef({ start: 0, end: 0 });
  const dictationRef = useRef<{ start: number; length: number } | null>(null);
  const [linkAction, setLinkAction] = useState<{ url: string; label: string } | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      insertCheckbox: () => {
        const { newText } = insertCheckboxAtCursor(draft, selectionRef.current.start);
        onDraftChange(newText);
      },
      insertDotted: () => {
        const { newText } = insertDottedAtCursor(draft, selectionRef.current.start);
        onDraftChange(newText);
      },
      insertNumbered: () => {
        const { newText } = insertNumberedAtCursor(draft, selectionRef.current.start);
        onDraftChange(newText);
      },
      wrapStrikethrough: () => {
        const { start, end } = selectionRef.current;
        const { newText } = wrapStrikethrough(draft, start, end);
        onDraftChange(newText);
      },
      beginDictation: () => {
        dictationRef.current = { start: selectionRef.current.start, length: 0 };
      },
      updateDictation: (transcript: string, isFinal: boolean) => {
        const anchor = dictationRef.current;
        if (!anchor) return;

        // Our own source of truth for boundary spacing — ignore whatever
        // leading/trailing whitespace the recognizer's own transcript has.
        const cleanTranscript = transcript.trim();

        let { start } = anchor;
        let text = draft;

        // Starting a fresh utterance (nothing replaceable yet) — insert
        // exactly one separating space if the text immediately before the
        // cursor needs it, then treat that space as already-committed
        // rather than part of the replaceable region.
        if (anchor.length === 0 && cleanTranscript.length > 0) {
          const prevChar = text[start - 1];
          if (prevChar && !/\s/.test(prevChar)) {
            text = text.slice(0, start) + ' ' + text.slice(start);
            start += 1;
          }
        }

        const { newText, newCursorPos } = replaceRange(
          text,
          start,
          start + anchor.length,
          cleanTranscript,
        );

        dictationRef.current = isFinal
          ? { start: newCursorPos, length: 0 }
          : { start, length: cleanTranscript.length };
        selectionRef.current = { start: newCursorPos, end: newCursorPos };
        onDraftChange(newText);
      },
    }),
    [draft, onDraftChange],
  );

  function handleCheckboxToggle(lineIndex: number) {
    onCheckboxToggle(toggleCheckboxLine(text, lineIndex));
  }

  if (editing) {
    return (
      <TextInput
        style={{
          fontFamily: FONT.kalam,
          fontSize: 20,
          color: colors.ink,
          lineHeight: 28,
          letterSpacing: 0.1,
          textAlignVertical: 'top',
        }}
        value={draft}
        onChangeText={onDraftChange}
        onSelectionChange={(e) => {
          selectionRef.current = e.nativeEvent.selection;
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.ink4}
        multiline
        autoFocus
        selectionColor={colors.amber}
        cursorColor={colors.amber}
      />
    );
  }

  return (
    <>
      <FormattedText
        text={text}
        links={links}
        size={20}
        lineHeight={28}
        letterSpacing={0.1}
        style={textStyle}
        onLinkPress={(url, label) => setLinkAction({ url, label })}
        onCheckboxToggle={handleCheckboxToggle}
      />

      <ConfirmationDialog
        visible={!!linkAction}
        title={linkAction?.label ?? ''}
        subtitle={linkAction ? getDomain(linkAction.url) : undefined}
        actions={[
          {
            label: 'open link',
            color: 'amber',
            onPress: () => {
              if (linkAction) Linking.openURL(linkAction.url);
              setLinkAction(null);
            },
          },
        ]}
        onClose={() => setLinkAction(null)}
      />
    </>
  );
});
