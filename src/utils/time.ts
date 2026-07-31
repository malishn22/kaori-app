import type { TimeOfDay } from '@/types';
import { MS_PER_DAY } from '@/constants';

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

export function getDayName(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Next Date matching the given weekday+time — today if still upcoming, otherwise next week. */
export function nextOccurrence(dayOfWeek: number, hour: number, minute: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);
  let dayDiff = dayOfWeek - now.getDay();
  if (dayDiff < 0 || (dayDiff === 0 && result.getTime() <= now.getTime())) {
    dayDiff += 7;
  }
  result.setDate(result.getDate() + dayDiff);
  return result;
}

export function formatTimeOfDay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function computeDisplayStrings(createdAt: string): { time: string; date: string } {
  const created = new Date(createdAt);
  const now = new Date();

  const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((todayDay.getTime() - createdDay.getTime()) / MS_PER_DAY);

  let date: string;
  if (diffDays === 0) date = 'today';
  else if (diffDays === 1) date = 'yesterday';
  else if (diffDays < 7) date = `${diffDays} days`;
  else date = `${Math.floor(diffDays / 7)}w ago`;

  const h = created.getHours();
  const m = created.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const time = `${h12}:${m} ${ampm}`;

  return { time, date };
}

export function timeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  if (isNaN(ms)) return isoString; // legacy fallback
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 604_800_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return `${Math.floor(ms / 604_800_000)}w ago`;
}
