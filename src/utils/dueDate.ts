import { MS_PER_DAY } from '@/constants';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getDateChipOptions(): { label: string; date: Date }[] {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today.getTime() + MS_PER_DAY);
  const in3Days = new Date(today.getTime() + 3 * MS_PER_DAY);
  const nextWeek = new Date(today.getTime() + 7 * MS_PER_DAY);
  return [
    { label: 'today', date: today },
    { label: 'tomorrow', date: tomorrow },
    { label: 'in 3 days', date: in3Days },
    { label: 'next week', date: nextWeek },
  ];
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function formatDueDate(iso: string): string {
  const due = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  const diff = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY);

  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';

  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const label = `${months[due.getMonth()]} ${due.getDate()}`;

  if (due.getFullYear() !== today.getFullYear()) {
    return `${label}, ${due.getFullYear()}`;
  }
  return label;
}

export function isOverdue(iso: string): boolean {
  return startOfDay(new Date(iso)).getTime() < startOfDay(new Date()).getTime();
}

export function isDueSoon(iso: string): boolean {
  const diff = startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime();
  return diff >= 0 && diff <= 3 * MS_PER_DAY;
}
