import type {
  Canvas,
  CanvasFile,
  CanvasFileStorage,
  CanvasScene,
  CanvasSceneStorage,
} from 'kaori-core';
import { parseScene, serializeScene } from 'kaori-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeGet, safeSet } from './storage';

// Canvases deliberately break the app's whole-collection-array convention.
//
// Every other entity stores its entire list under one key and rewrites the lot on any
// change. That is fine for notes and tasks — a few KB — but a scene is large and rewritten
// on a debounce while drawing, so one key per document is the difference between writing a
// few KB per save and re-stringifying every canvas you own on every stroke.
//
// Metadata (titles, timestamps) still uses the shared-array shape, since listing canvases
// wants exactly that and never needs a scene.
const META_KEY = '@kaori_canvases';
const scenePrefix = (id: string) => `@kaori_canvas_${id}`;
const filePrefix = (id: string) => `@kaori_canvas_file_${id}`;

// Android's AsyncStorage has a per-value ceiling (~2MB by default) that a large scene or a
// photo can genuinely reach. Writes below check against this and reject rather than
// truncating, because a silently dropped scene loses the drawing itself.
const MAX_VALUE_BYTES = 1_800_000;

// A base64 codec written out rather than reached for. Hermes has no `Buffer`, and
// `atob`/`btoa` are not dependable across React Native versions — this is ~20 lines and
// removes the question entirely.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? '=' : B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    out += c === undefined ? '=' : B64[c & 63];
  }
  return out;
}

function fromBase64(text: string): Uint8Array {
  const clean = text.replace(/=+$/, '');
  const out = new Uint8Array((clean.length * 3) >> 2);
  let n = 0;
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const v = B64.indexOf(ch);
    if (v === -1) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[n++] = (buffer >> bits) & 0xff;
    }
  }
  return out.subarray(0, n);
}

function tooLarge(value: string): boolean {
  // A rough byte count: base64 and JSON are effectively ASCII, so length is close enough
  // to catch the case that matters without walking the string twice.
  return value.length > MAX_VALUE_BYTES;
}

export async function loadCanvases(): Promise<Canvas[]> {
  const raw = await safeGet(META_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Canvas[]) : [];
  } catch {
    return [];
  }
}

export async function saveCanvases(canvases: Canvas[]): Promise<void> {
  await safeSet(META_KEY, JSON.stringify(canvases));
}

// Unlike safeSet, these reject on failure. `safeSet` swallows errors with a console
// warning, which is survivable for a note (you lose a sentence) and not for a scene
// (you lose the drawing, with nothing on screen to say so).
export const asyncCanvasSceneStore: CanvasSceneStorage = {
  async get(canvasId) {
    const raw = await safeGet(scenePrefix(canvasId));
    // parseScene tolerates null and anything malformed by returning an empty scene, so a
    // never-saved canvas opens blank rather than erroring.
    return parseScene(raw);
  },

  async put(canvasId, scene: CanvasScene) {
    const payload = serializeScene(scene);
    if (tooLarge(payload)) {
      throw new Error('this drawing is too large to save on this device');
    }
    await AsyncStorage.setItem(scenePrefix(canvasId), payload);
  },

  async remove(canvasId) {
    await AsyncStorage.removeItem(scenePrefix(canvasId));
  },
};

// Image bytes as base64 under their own per-file key. Same reasoning as scenes: written
// once, read only for the images actually on screen, and far too large to sit inside a
// value that gets rewritten on every edit.
export const asyncCanvasFileStore: CanvasFileStorage = {
  async get(id) {
    const raw = await safeGet(filePrefix(id));
    if (!raw) return null;
    const split = raw.indexOf(';');
    if (split === -1) return null;
    return { id, mimeType: raw.slice(0, split), data: fromBase64(raw.slice(split + 1)) };
  },

  async put(file: CanvasFile) {
    const payload = `${file.mimeType};${toBase64(file.data)}`;
    if (tooLarge(payload)) {
      throw new Error('that image is too large to store on this device');
    }
    await AsyncStorage.setItem(filePrefix(file.id), payload);
  },

  async prune(referencedIds) {
    const keys = await AsyncStorage.getAllKeys();
    const orphans = keys.filter(
      (k) =>
        k.startsWith(filePrefix('')) && !referencedIds.includes(k.slice(filePrefix('').length)),
    );
    if (orphans.length > 0) await AsyncStorage.multiRemove(orphans);
  },
};

// Collects scene keys with no matching canvas — the mobile counterpart of the desktop
// prune. Same timing rule applies: only run it when no editor is open, since it reads
// persisted state while the editor saves on a debounce.
export async function pruneOrphanedCanvasData(canvases: Canvas[]): Promise<void> {
  const live = new Set(canvases.map((c) => c.id));
  const keys = await AsyncStorage.getAllKeys();

  const orphanScenes = keys
    .filter(
      (k) => k.startsWith('@kaori_canvas_') && !k.startsWith(filePrefix('')) && k !== META_KEY,
    )
    .filter((k) => !live.has(k.slice('@kaori_canvas_'.length)));

  if (orphanScenes.length > 0) await AsyncStorage.multiRemove(orphanScenes);

  // Then drop any file no surviving scene references.
  const referenced: string[] = [];
  for (const canvas of canvases) {
    const scene = await asyncCanvasSceneStore.get(canvas.id);
    for (const el of scene?.elements ?? []) {
      if (el.kind === 'image') referenced.push(el.fileId);
    }
  }
  await asyncCanvasFileStore.prune(referenced);
}
