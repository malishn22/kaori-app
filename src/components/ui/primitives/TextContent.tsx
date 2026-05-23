import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, Linking, type TextStyle } from 'react-native';
import { useTheme, FONT } from '@/theme';
import { FormattedText } from './FormattedText';
import { ConfirmationDialog } from './ConfirmationDialog';
import { insertCheckboxAtCursor, wrapStrikethrough, toggleCheckboxLine } from '@/utils/noteFormat';
import { getDomain } from '@/utils/links';

export type TextContentHandle = {
  insertCheckbox: () => void;
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
  minHeight?: number;
};

export const TextContent = forwardRef<TextContentHandle, Props>(function TextContent(
  {
    text,
    links,
    editing,
    draft,
    onDraftChange,
    onCheckboxToggle,
    textStyle,
    placeholder,
    minHeight,
  },
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
          ...(minHeight != null ? { minHeight } : {}),
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
