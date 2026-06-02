import { extractUrls } from './links';

export type FormattedSegment =
  | { type: 'text'; value: string }
  | { type: 'strikethrough'; value: string }
  | { type: 'url'; value: string };

export type FormattedLine =
  | { type: 'plain'; segments: FormattedSegment[] }
  | { type: 'checkbox'; checked: boolean; segments: FormattedSegment[] }
  | { type: 'dotted'; level: number; segments: FormattedSegment[] }
  | { type: 'numbered'; segments: FormattedSegment[] };

const CHECKBOX_LINE = /^\[([ x])\] (.*)$/s;
const DOTTED_LINE = /^( *)- (.*)$/s;
const NUMBERED_LINE = /^\d+\. (.*)$/s;
const STRIKETHROUGH = /~~(.+?)~~/gs;

export function parseLineSegments(content: string): FormattedSegment[] {
  const urls = extractUrls(content);
  const segments: FormattedSegment[] = [];

  // Split content into url / non-url chunks first, then apply strikethrough within text chunks
  let remaining = content;

  for (const url of urls) {
    const idx = remaining.indexOf(url);
    if (idx === -1) continue;

    const before = remaining.slice(0, idx);
    if (before) segments.push(...parseStrikethrough(before));

    segments.push({ type: 'url', value: url });
    remaining = remaining.slice(idx + url.length);
  }

  if (remaining) segments.push(...parseStrikethrough(remaining));

  return segments;
}

function parseStrikethrough(text: string): FormattedSegment[] {
  if (!text.includes('~~')) return [{ type: 'text', value: text }];

  const segments: FormattedSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  STRIKETHROUGH.lastIndex = 0;
  while ((match = STRIKETHROUGH.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'strikethrough', value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

export function parseNoteText(text: string): FormattedLine[] {
  const lines = text.split('\n');
  const indentStack: number[] = [0];

  return lines.map((line) => {
    const m = CHECKBOX_LINE.exec(line);
    if (m) {
      return {
        type: 'checkbox',
        checked: m[1] === 'x',
        segments: parseLineSegments(m[2]),
      };
    }
    const dm = DOTTED_LINE.exec(line);
    if (dm) {
      const spaces = dm[1].length;
      while (indentStack.length > 1 && indentStack[indentStack.length - 1] > spaces) {
        indentStack.pop();
      }
      if (spaces > indentStack[indentStack.length - 1]) {
        indentStack.push(spaces);
      }
      const level = indentStack.length;
      return { type: 'dotted', level, segments: parseLineSegments(dm[2]) };
    }
    const nm = NUMBERED_LINE.exec(line);
    if (nm) {
      return { type: 'numbered', segments: parseLineSegments(nm[1]) };
    }
    return { type: 'plain', segments: parseLineSegments(line) };
  });
}

export function toggleCheckboxLine(text: string, lineIndex: number): string {
  const lines = text.split('\n');
  if (lineIndex < 0 || lineIndex >= lines.length) return text;

  const line = lines[lineIndex];
  const m = CHECKBOX_LINE.exec(line);
  if (!m) return text;

  lines[lineIndex] = m[1] === ' ' ? `[x] ${m[2]}` : `[ ] ${m[2]}`;
  return lines.join('\n');
}

function getLineStart(text: string, cursorPos: number): number {
  return text.lastIndexOf('\n', cursorPos - 1) + 1;
}

function getPrevLine(text: string, lineStart: number): string {
  const prevEnd = lineStart - 1;
  if (prevEnd < 0) return '';
  return text.slice(text.lastIndexOf('\n', prevEnd - 1) + 1, prevEnd);
}

export function insertCheckboxAtCursor(
  text: string,
  cursorPos: number,
): { newText: string; newCursorPos: number } {
  const prefix = '[ ] ';
  const lineStart = getLineStart(text, cursorPos);
  const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
  return { newText, newCursorPos: cursorPos + prefix.length };
}

export function insertDottedAtCursor(
  text: string,
  cursorPos: number,
): { newText: string; newCursorPos: number } {
  const prefix = '- ';
  const lineStart = getLineStart(text, cursorPos);
  const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
  return { newText, newCursorPos: cursorPos + prefix.length };
}

export function insertNumberedAtCursor(
  text: string,
  cursorPos: number,
): { newText: string; newCursorPos: number } {
  const lineStart = getLineStart(text, cursorPos);
  const prevLine = getPrevLine(text, lineStart);
  const m = /^(\d+)\./.exec(prevLine);
  const n = m ? parseInt(m[1], 10) + 1 : 1;
  const prefix = `${n}. `;
  const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
  return { newText, newCursorPos: cursorPos + prefix.length };
}

export function continueFormattingOnEnter(
  text: string,
  cursorPos: number,
): { newText: string; newCursorPos: number } | null {
  const lineEnd = cursorPos - 1; // index of the '\n' that was just inserted
  const lineStart = text.lastIndexOf('\n', lineEnd - 1) + 1;
  const prevLine = text.slice(lineStart, lineEnd);

  const cm = CHECKBOX_LINE.exec(prevLine);
  if (cm) {
    if (cm[2] === '') {
      // Escape hatch: blank checkbox line → remove the prefix
      const newText = text.slice(0, lineStart) + text.slice(lineEnd);
      return { newText, newCursorPos: lineStart };
    }
    const prefix = '[ ] ';
    const newText = text.slice(0, cursorPos) + prefix + text.slice(cursorPos);
    return { newText, newCursorPos: cursorPos + prefix.length };
  }

  const dm = DOTTED_LINE.exec(prevLine);
  if (dm) {
    const indent = dm[1];
    if (dm[2] === '') {
      // Escape hatch: blank dotted line → remove the prefix
      const newText = text.slice(0, lineStart) + text.slice(lineEnd);
      return { newText, newCursorPos: lineStart };
    }
    const prefix = `${indent}- `;
    const newText = text.slice(0, cursorPos) + prefix + text.slice(cursorPos);
    return { newText, newCursorPos: cursorPos + prefix.length };
  }

  const nm = /^(\d+)\. (.*)$/s.exec(prevLine);
  if (nm) {
    if (nm[2] === '') {
      // Escape hatch: blank numbered line → remove the prefix
      const newText = text.slice(0, lineStart) + text.slice(lineEnd);
      return { newText, newCursorPos: lineStart };
    }
    const next = parseInt(nm[1], 10) + 1;
    const prefix = `${next}. `;
    const newText = text.slice(0, cursorPos) + prefix + text.slice(cursorPos);
    return { newText, newCursorPos: cursorPos + prefix.length };
  }

  return null;
}

export function wrapStrikethrough(
  text: string,
  start: number,
  end: number,
): { newText: string; newStart: number; newEnd: number } {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);

  if (start === end) {
    // No selection: insert ~~ ~~ and place cursor between them
    const newText = before + '~~~~' + after;
    return { newText, newStart: start + 2, newEnd: start + 2 };
  }

  const newText = before + '~~' + selected + '~~' + after;
  return { newText, newStart: start, newEnd: end + 4 };
}
