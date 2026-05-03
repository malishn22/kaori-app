import type { Note, Folder } from '@/types';
import { computeDisplayStrings } from '@/utils/time';
import { resolveNoteLinks, extractUrls } from '@/utils/links';
import { safeSet } from '@/utils/storage';
import { KEYS } from '@/utils/migration';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function createNoteActions(
  setNotes: SetState<Note[]>,
  setFolders: SetState<Folder[]>,
) {
  function addNote(text: string, folderId: string | null) {
    const createdAt = new Date().toISOString();
    const { time, date } = computeDisplayStrings(createdAt);
    const noteId = Date.now().toString();
    const newNote: Note = {
      id: noteId,
      folder: folderId,
      text,
      time,
      date,
      createdAt,
      tags: [],
      pinned: false,
      links: {},
    };

    setNotes(prev => {
      const next = [newNote, ...prev];
      safeSet(KEYS.notes, JSON.stringify(next));
      return next;
    });

    if (folderId) {
      setFolders(prev => {
        const next = prev.map(f => f.id !== folderId ? f : { ...f, count: f.count + 1, updated: new Date().toISOString() });
        safeSet(KEYS.folders, JSON.stringify(next));
        return next;
      });
    }

    if (extractUrls(text).length > 0) {
      resolveNoteLinks(text).then((links) => {
        setNotes(prev => {
          const next = prev.map(n => n.id === noteId ? { ...n, links } : n);
          safeSet(KEYS.notes, JSON.stringify(next));
          return next;
        });
      });
    }
  }

  function updateNote(id: string, patch: Partial<Pick<Note, 'text' | 'folder' | 'pinned' | 'links'>>) {
    setNotes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, ...patch } : n);
      safeSet(KEYS.notes, JSON.stringify(next));

      if (patch.text && extractUrls(patch.text).length > 0) {
        const existing = next.find(n => n.id === id);
        const mergedExisting = { ...existing?.links };
        resolveNoteLinks(patch.text, mergedExisting).then((links) => {
          setNotes(inner => {
            const updated = inner.map(n => n.id === id ? { ...n, links } : n);
            safeSet(KEYS.notes, JSON.stringify(updated));
            return updated;
          });
        });
      }

      return next;
    });
  }

  function updateNoteLink(noteId: string, url: string, label: string) {
    setNotes(prev => {
      const next = prev.map(n => {
        if (n.id !== noteId) return n;
        return { ...n, links: { ...n.links, [url]: label } };
      });
      safeSet(KEYS.notes, JSON.stringify(next));
      return next;
    });
  }

  function deleteNote(id: string) {
    setNotes(prev => {
      const note = prev.find(n => n.id === id);
      if (note?.folder) {
        setFolders(prevFolders => {
          const next = prevFolders.map(f => f.id !== note.folder ? f : { ...f, count: Math.max(0, f.count - 1) });
          safeSet(KEYS.folders, JSON.stringify(next));
          return next;
        });
      }
      const next = prev.filter(n => n.id !== id);
      safeSet(KEYS.notes, JSON.stringify(next));
      return next;
    });
  }

  function archiveNote(id: string, archived: boolean) {
    setNotes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, archived } : n);
      safeSet(KEYS.notes, JSON.stringify(next));
      return next;
    });
  }

  return { addNote, updateNote, updateNoteLink, deleteNote, archiveNote };
}
