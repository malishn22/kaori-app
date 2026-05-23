import { extractUrls } from './links';

export type FormattedSegment =
  | { type: 'text'; value: string }
  | { type: 'strikethrough'; value: string }
  | { type: 'url'; value: string };

export type FormattedLine =
  | { type: 'plain'; segments: FormattedSegment[] }
  | { type: 'checkbox'; checked: boolean; segments: FormattedSegment[] };

const CHECKBOX_LINE = /^\[([ x])\] (.*)$/s;
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
  return lines.map((line) => {
    const m = CHECKBOX_LINE.exec(line);
    if (m) {
      return {
        type: 'checkbox',
        checked: m[1] === 'x',
        segments: parseLineSegments(m[2]),
      };
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

export function insertCheckboxAtCursor(
  text: string,
  cursorPos: number,
): { newText: string; newCursorPos: number } {
  const prefix = '[ ] ';
  // Find start of the current line
  const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
  const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
  return { newText, newCursorPos: cursorPos + prefix.length };
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
