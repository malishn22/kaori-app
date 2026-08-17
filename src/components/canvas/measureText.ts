import type { MeasureText, TextElement } from 'kaori-core';
import { FONT_METRICS } from './fontMetrics';

// The injected `measure` that kaori-core's wrapText/layoutText take. The wrapping algorithm
// is shared with desktop; only the measurement differs — desktop uses an offscreen 2D
// context, and React Native has no synchronous text measurement at all.
//
// Summing per-character advances from the font's own hmtx table (see
// scripts/gen-font-metrics.mjs). It ignores kerning and ligatures, so it can be a fraction of
// a pixel out on a long line — but it is the same number the renderer will lay out to within
// that margin, which is what matters: the element's stored width comes from here, and
// hit-testing works off those bounds.
export function measurerFor(el: Pick<TextElement, 'fontSize' | 'fontFamily'>): MeasureText {
  const metrics = FONT_METRICS[el.fontFamily];
  return (text: string) => {
    let em = 0;
    // Iterating the string yields whole codepoints, so a surrogate pair counts once rather
    // than twice — an emoji measured as two average characters would wrap early.
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      em += (cp !== undefined ? metrics.widths[cp] : undefined) ?? metrics.average;
    }
    return em * el.fontSize;
  };
}
