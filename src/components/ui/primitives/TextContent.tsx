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
  continueFormattingOnEnter,
} from '@/utils/noteFormat';
import { getDomain } from '@/utils/links';

export type TextContentHandle = {
  insertCheckbox: () => void;
  insertDotted: () => void;
  insertNumbered: () => void;
  wrapStrikethrough: () => void;
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
    }),
    [draft, onDraftChange],
  );

  function handleCheckboxToggle(lineIndex: number) {
    onCheckboxToggle(toggleCheckboxLine(text, lineIndex));
  }

  function handleDraftChange(next: string) {
    let prefixLen = 0;
    const minLen = Math.min(draft.length, next.length);
    while (prefixLen < minLen && next[prefixLen] === draft[prefixLen]) {
      prefixLen++;
    }
    let suffixLen = 0;
    while (
      suffixLen < draft.length - prefixLen &&
      suffixLen < next.length - prefixLen &&
      next[next.length - 1 - suffixLen] === draft[draft.length - 1 - suffixLen]
    ) {
      suffixLen++;
    }
    const inserted = next.slice(prefixLen, next.length - suffixLen);
    if (inserted.endsWith('\n')) {
      // Detect newline position without assuming onSelectionChange/onChangeText ordering:
      // if cursor is right after a \n it's the post-change cursor (newlinePos = cursor);
      // if cursor is sitting on a \n it's the pre-change cursor (newlinePos = cursor + 1).
      let newlinePos = prefixLen + inserted.length;
      if (inserted === '\n') {
        const cursor = selectionRef.current.start;
        if (cursor > 0 && next[cursor - 1] === '\n') {
          newlinePos = cursor;
        } else if (cursor < next.length && next[cursor] === '\n') {
          newlinePos = cursor + 1;
        }
      }
      const result = continueFormattingOnEnter(next, newlinePos);
      if (result) {
        onDraftChange(result.newText);
        return;
      }
    }
    onDraftChange(next);
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
        onChangeText={handleDraftChange}
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
