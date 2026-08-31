import type { ClassEntry } from '@/types';

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function nowMinutes(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function minutesToCountdown(mins: number): string {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function daysBetween(startDate: string, targetDate: Date): number {
  const start = new Date(startDate + 'T00:00:00');
  const target = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  );
  const diffMs = target.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getRotatingSubject(
  cls: ClassEntry,
  date: Date = new Date(),
): string | null {
  if (cls.type !== 'rotating' || !cls.rotation_subjects || !cls.rotation_start_date) {
    return null;
  }
  const subjects = cls.rotation_subjects;
  if (subjects.length === 0) return null;
  const days = daysBetween(cls.rotation_start_date, date);
  const index =
    Math.floor(days / Math.max(cls.rotation_period_days, 1)) % subjects.length;
  const normalized = ((index % subjects.length) + subjects.length) % subjects.length;
  return subjects[normalized];
}

export type ClassStatus = 'upcoming' | 'active' | 'ended';

export function getClassStatus(cls: ClassEntry, date: Date = new Date()): ClassStatus {
  const start = parseTimeToMinutes(cls.start_time);
  const end = parseTimeToMinutes(cls.end_time);
  const now = nowMinutes(date);
  if (now < start) return 'upcoming';
  if (now >= start && now < end) return 'active';
  return 'ended';
}

export function isClassOnDay(cls: ClassEntry, date: Date): boolean {
  if (cls.type === 'fixed') {
    return cls.weekday === date.getDay();
  }
  return true;
}

export function getClassesForDay(classes: ClassEntry[], date: Date): ClassEntry[] {
  return classes
    .filter((c) => isClassOnDay(c, date))
    .sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time));
}
