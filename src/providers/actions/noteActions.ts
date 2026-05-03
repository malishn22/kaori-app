import type { Note, Folder } from '@/types';
import { computeDisplayStrings } from '@/utils/time';
import { resolveNoteLinks, extractUrls } from '@/utils/links';
import { safeSet, safeMultiSet } from '@/utils/storage';
import { KEYS } from '@/utils/migration';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function createNoteActions(
  notes: Note[],
  setNotes: SetState<Note[]>,
  folders: Folder[],
  setFolders: SetState<Folder[]>,
) {
  async function addNote(text: string, folderId: string | null) {
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

    const nextNotes = [newNote, ...notes];

    const nextFolders = folderId
      ? folders.map((f) => {
          if (f.id !== folderId) return f;
          return { ...f, count: f.count + 1, updated: new Date().toISOString() };
        })
      : folders;

    setNotes(nextNotes);
    setFolders(nextFolders);

    await safeMultiSet([
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.folders, JSON.stringify(nextFolders)],
    ]);

    if (extractUrls(text).length > 0) {
      resolveNoteLinks(text).then(async (links) => {
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === noteId ? { ...n, links } : n));
          safeSet(KEYS.notes, JSON.stringify(updated));
          return updated;
        });
      });
    }
  }

  async function updateNote(id: string, patch: Partial<Pick<Note, 'text' | 'folder' | 'pinned' | 'links'>>) {
    const nextNotes = notes.map(n => n.id === id ? { ...n, ...patch } : n);
    setNotes(nextNotes);
    await safeSet(KEYS.notes, JSON.stringify(nextNotes));

    if (patch.text && extractUrls(patch.text).length > 0) {
      const mergedExisting = { ...notes.find(n => n.id === id)?.links, ...patch.links };
      resolveNoteLinks(patch.text, mergedExisting).then(async (links) => {
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === id ? { ...n, links } : n));
          safeSet(KEYS.notes, JSON.stringify(updated));
          return updated;
        });
      });
    }
  }

  async function updateNoteLink(noteId: string, url: string, label: string) {
    const nextNotes = notes.map(n => {
      if (n.id !== noteId) return n;
      return { ...n, links: { ...n.links, [url]: label } };
    });
    setNotes(nextNotes);
    await safeSet(KEYS.notes, JSON.stringify(nextNotes));
  }

  async function deleteNote(id: string) {
    const note = notes.find(n => n.id === id);
    const nextNotes = notes.filter(n => n.id !== id);
    const nextFolders = note?.folder
      ? folders.map(f => f.id !== note.folder ? f : { ...f, count: Math.max(0, f.count - 1) })
      : folders;
    setNotes(nextNotes);
    setFolders(nextFolders);
    await safeMultiSet([
      [KEYS.notes, JSON.stringify(nextNotes)],
      [KEYS.folders, JSON.stringify(nextFolders)],
    ]);
  }

  async function archiveNote(id: string, archived: boolean) {
    const nextNotes = notes.map(n => n.id === id ? { ...n, archived } : n);
    setNotes(nextNotes);
    await safeSet(KEYS.notes, JSON.stringify(nextNotes));
  }

  return { addNote, updateNote, updateNoteLink, deleteNote, archiveNote };
}
