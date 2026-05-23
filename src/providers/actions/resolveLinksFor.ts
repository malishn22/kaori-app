import { resolveNoteLinks, extractUrls } from '@/utils/links';
import { safeSet } from '@/utils/storage';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
type Linked = { id: string; links: Record<string, string> };

/**
 * Resolve URL labels for the given text, then merge them into the item's `links`.
 * `preserve` wins over freshly-resolved titles so user-edited labels stick.
 * No-op when the text has no URLs.
 */
export function resolveLinksFor<T extends Linked>(
  setItems: SetState<T[]>,
  storageKey: string,
  id: string,
  text: string,
  preserve: Record<string, string> = {},
) {
  if (extractUrls(text).length === 0) return;

  resolveNoteLinks(text, preserve).then((resolved) => {
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id !== id ? item : { ...item, links: { ...resolved, ...preserve } },
      );
      safeSet(storageKey, JSON.stringify(next));
      return next;
    });
  });
}
