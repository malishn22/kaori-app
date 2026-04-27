const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
const MAX_TITLE_LENGTH = 50;

export function truncateTitle(title: string, max = MAX_TITLE_LENGTH): string {
  if (title.length <= max) return title;
  return title.slice(0, max).trimEnd() + '…';
}

export function extractUrls(text: string): string[] {
  return Array.from(text.matchAll(URL_REGEX), (m) => m[0]);
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export async function fetchPageTitle(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });
    if (!res.ok) return getDomain(url);

    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match?.[1]) return truncateTitle(match[1].trim());

    return getDomain(url);
  } catch {
    return getDomain(url);
  }
}

export async function resolveNoteLinks(
  text: string,
  existingLinks?: Record<string, string>,
): Promise<Record<string, string>> {
  const urls = extractUrls(text);
  if (urls.length === 0) return {};

  const results: Record<string, string> = {};

  await Promise.all(
    urls.map(async (url) => {
      // Reuse existing title if we already fetched it
      if (existingLinks?.[url]) {
        results[url] = existingLinks[url];
      } else {
        results[url] = await fetchPageTitle(url);
      }
    }),
  );

  return results;
}

const LINK_DELIM_REGEX = /\u00ab\s*(.+?)\s*\|\s*(https?:\/\/[^\s\u00bb]+)\s*\u00bb/g;

export function toEditableText(text: string, links: Record<string, string>): string {
  const urls = extractUrls(text);
  if (urls.length === 0) return text;

  let result = text;
  for (const url of urls) {
    const title = links[url];
    if (title) {
      result = result.replace(url, `\u00ab ${title} | ${url} \u00bb`);
    }
  }
  return result;
}

export function fromEditableText(draft: string): { text: string; links: Record<string, string> } {
  const links: Record<string, string> = {};

  const text = draft.replace(LINK_DELIM_REGEX, (_match, title, url) => {
    links[url] = title.trim();
    return url;
  });

  return { text, links };
}
