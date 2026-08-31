import { Pencil, Trash2 } from 'lucide-react';
import type { ClassEntry } from '@/types';
import { colorOf } from '@/lib/colors';
import {
  formatTime,
  getClassStatus,
  getRotatingSubject,
  minutesToCountdown,
  nowMinutes,
  parseTimeToMinutes,
} from '@/lib/time';

interface ClassCardProps {
  cls: ClassEntry;
  date: Date;
  onEdit: (cls: ClassEntry) => void;
  onDelete: (cls: ClassEntry) => void;
}

export default function ClassCard({ cls, date, onEdit, onDelete }: ClassCardProps) {
  const c = colorOf(cls.color);
  const status = getClassStatus(cls, date);
  const now = nowMinutes(date);
  const start = parseTimeToMinutes(cls.start_time);
  const end = parseTimeToMinutes(cls.end_time);

  let countdownText = '';
  if (status === 'upcoming') {
    countdownText = `in ${minutesToCountdown(start - now)}`;
  } else if (status === 'active') {
    countdownText = `ends in ${minutesToCountdown(end - now)}`;
  } else {
    countdownText = 'ended';
  }

  const subject = getRotatingSubject(cls, date);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${c.border} ${c.soft} ${c.softDark} p-4 transition hover:shadow-md dark:border-slate-700`}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 ${c.bg}`} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.dot}`} />
            <h3 className="truncate text-base font-bold text-slate-800 dark:text-white">{cls.name}</h3>
          </div>
          {subject && (
            <p className={`mt-1 pl-[18px] text-sm font-semibold ${c.text} ${c.textDark}`}>
              Today: {subject}
            </p>
          )}
          <p className="mt-1.5 pl-[18px] text-sm text-slate-500 dark:text-slate-400">
            {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              status === 'active'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : status === 'upcoming'
                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            {countdownText}
          </span>
          <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => onEdit(cls)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(cls)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-500 dark:hover:bg-slate-800"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
