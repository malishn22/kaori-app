import { useState, useCallback } from 'react';

type UseInlineEditOptions = {
  initialValue: string;
  onSave: (trimmedValue: string) => void | Promise<void>;
};

export function useInlineEdit({ initialValue, onSave }: UseInlineEditOptions) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue);

  const startEditing = useCallback((overrideValue?: string) => {
    setDraft(overrideValue ?? initialValue);
    setEditing(true);
  }, [initialValue]);

  const commitEdit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed) onSave(trimmed);
    setEditing(false);
  }, [draft, onSave]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  return { editing, draft, setDraft, startEditing, commitEdit, cancelEdit };
}
