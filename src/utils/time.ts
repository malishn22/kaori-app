import type { TimeOfDay } from '@/types';

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

export function computeDisplayStrings(createdAt: string): { time: string; date: string } {
  const created = new Date(createdAt);
  const now = new Date();

  const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((todayDay.getTime() - createdDay.getTime()) / 86400000);

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
