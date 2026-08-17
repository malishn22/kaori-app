#!/usr/bin/env node
// Extracts per-character advance widths from the app's TTFs and writes them to
// src/components/canvas/fontMetrics.ts.
//
// Why this exists: kaori-core's wrapText takes an injected measurer. Desktop measures
// exactly with an offscreen 2D context; React Native has no synchronous text measurement at
// all. The canvas needs measurement to be synchronous, because an element's stored width and
// its wrapped lines have to agree with what's drawn — hit-testing works off those bounds, so
// a guessed width means tapping a shape misses it.
//
// A hand-written "average character width" table gets that wrong for anything but lorem
// ipsum. These are the fonts' own numbers, so wrapping matches the glyphs actually rendered.
//
// Run:  node scripts/gen-font-metrics.mjs   (checked-in output; re-run if a font changes)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = dirname(HERE);

// Every codepoint worth tabulating: printable ASCII plus the punctuation that actually shows
// up in notes. Anything absent falls back to the average advance at runtime.
const CHARS = [];
for (let c = 0x20; c <= 0x7e; c += 1) CHARS.push(c);
for (const extra of ['—', '–', '’', '‘', '“', '”', '…', '•', '×', '→', '°']) {
  CHARS.push(extra.codePointAt(0));
}

function parseTTF(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const u16 = (o) => view.getUint16(o);
  const i16 = (o) => view.getInt16(o);
  const u32 = (o) => view.getUint32(o);

  // sfnt header: numTables at offset 4, then 16-byte directory entries.
  const numTables = u16(4);
  const tables = {};
  for (let i = 0; i < numTables; i += 1) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(buffer[rec], buffer[rec + 1], buffer[rec + 2], buffer[rec + 3]);
    tables[tag] = { offset: u32(rec + 8), length: u32(rec + 12) };
  }
  for (const required of ['head', 'hhea', 'hmtx', 'cmap', 'maxp']) {
    if (!tables[required]) throw new Error(`missing required table: ${required}`);
  }

  const unitsPerEm = u16(tables.head.offset + 18);
  const numGlyphs = u16(tables.maxp.offset + 4);
  const numberOfHMetrics = u16(tables.hhea.offset + 34);

  // hmtx: numberOfHMetrics (advance, lsb) pairs, then lsb-only entries that reuse the last
  // advance — monospace-ish tails are stored that way to save space.
  const advance = new Array(numGlyphs);
  let last = 0;
  for (let g = 0; g < numGlyphs; g += 1) {
    if (g < numberOfHMetrics) {
      last = u16(tables.hmtx.offset + g * 4);
    }
    advance[g] = last;
  }

  // cmap: find a Unicode BMP subtable (platform 3 / encoding 1 or 10, or platform 0).
  const cmap = tables.cmap.offset;
  const numSubtables = u16(cmap + 2);
  let best = null;
  for (let i = 0; i < numSubtables; i += 1) {
    const rec = cmap + 4 + i * 8;
    const platform = u16(rec);
    const encoding = u16(rec + 2);
    const offset = u32(rec + 4);
    const score =
      platform === 3 && encoding === 10
        ? 3
        : platform === 3 && encoding === 1
          ? 2
          : platform === 0
            ? 1
            : 0;
    if (score > 0 && (!best || score > best.score)) best = { score, offset: cmap + offset };
  }
  if (!best) throw new Error('no usable cmap subtable');

  const format = u16(best.offset);
  const glyphFor = (code) => {
    if (format === 4) {
      const segCountX2 = u16(best.offset + 6);
      const endBase = best.offset + 14;
      const startBase = endBase + segCountX2 + 2;
      const deltaBase = startBase + segCountX2;
      const rangeBase = deltaBase + segCountX2;
      for (let s = 0; s < segCountX2 / 2; s += 1) {
        if (code > u16(endBase + s * 2)) continue;
        const start = u16(startBase + s * 2);
        if (code < start) return 0;
        const rangeOffset = u16(rangeBase + s * 2);
        if (rangeOffset === 0) return (code + i16(deltaBase + s * 2)) & 0xffff;
        const addr = rangeBase + s * 2 + rangeOffset + (code - start) * 2;
        const g = u16(addr);
        return g === 0 ? 0 : (g + i16(deltaBase + s * 2)) & 0xffff;
      }
      return 0;
    }
    if (format === 12) {
      const nGroups = u32(best.offset + 12);
      for (let g = 0; g < nGroups; g += 1) {
        const rec = best.offset + 16 + g * 12;
        const startChar = u32(rec);
        const endChar = u32(rec + 4);
        if (code >= startChar && code <= endChar) return u32(rec + 8) + (code - startChar);
      }
      return 0;
    }
    throw new Error(`unsupported cmap format: ${format}`);
  };

  const widths = {};
  let sum = 0;
  let counted = 0;
  for (const code of CHARS) {
    const glyph = glyphFor(code);
    if (!glyph) continue;
    // Normalised to em units, so the runtime measurer is just `width * fontSize`.
    const em = advance[glyph] / unitsPerEm;
    widths[code] = Math.round(em * 10000) / 10000;
    sum += em;
    counted += 1;
  }
  return { widths, average: Math.round((sum / counted) * 10000) / 10000 };
}

// 'hand' is Kalam_700Bold: the app only ever renders Kalam bold, so measuring the regular
// weight would come up short on every line — the same reasoning as desktop's fontString.
const FONTS = {
  sans: join(APP, 'assets/fonts/Geist-Regular.ttf'),
  hand: join(APP, 'node_modules/@expo-google-fonts/kalam/700Bold/Kalam_700Bold.ttf'),
};

const out = {};
for (const [name, path] of Object.entries(FONTS)) {
  out[name] = parseTTF(readFileSync(path));
  console.log(
    `${name}: ${Object.keys(out[name].widths).length} glyphs, avg ${out[name].average}em`,
  );
}

const body = `// GENERATED by scripts/gen-font-metrics.mjs — do not edit by hand.
//
// Per-character advance widths in em units, read from the fonts themselves. Multiply by the
// font size to get a width in scene units. Exists because React Native has no synchronous
// text measurement, and kaori-core's wrapText needs one: an element's stored bounds have to
// agree with the glyphs drawn, or hit-testing stops matching what you can see.
//
// Re-run the generator if Geist or Kalam is replaced.

export type CanvasFontKey = 'sans' | 'hand';

export type FontMetrics = {
  // Keyed by codepoint. Characters outside the table fall back to \`average\`.
  widths: Record<number, number>;
  average: number;
};

export const FONT_METRICS: Record<CanvasFontKey, FontMetrics> = {
${Object.entries(out)
  .map(
    ([name, m]) =>
      `  ${name}: {\n    average: ${m.average},\n    widths: ${JSON.stringify(m.widths)},\n  },`,
  )
  .join('\n')}
};
`;

const target = join(APP, 'src/components/canvas/fontMetrics.ts');
writeFileSync(target, body);
console.log(`wrote ${target}`);
