import { useState } from 'react';
import { Layers, X } from 'lucide-react';
import type { ClassEntry } from '@/types';
import { getRotatingSubject, getClassesForDay } from '@/lib/time';
import { colorOf } from '@/lib/colors';

interface CoreButtonProps {
  classes: ClassEntry[];
  date: Date;
}

export default function CoreButton({ classes, date }: CoreButtonProps) {
  const [open, setOpen] = useState(false);

  const rotating = classes.filter((c) => c.type === 'rotating');
  if (rotating.length === 0) return null;

  const todays = getClassesForDay(classes, date);
  const cores = todays
    .filter((c) => c.type === 'rotating')
    .map((c) => ({ cls: c, subject: getRotatingSubject(c, date) }))
    .filter((c) => c.subject);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-slate-800 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:scale-105 hover:bg-slate-900 active:scale-95 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        <Layers size={18} />
        Today's Core
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 sm:items-center sm:justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-white">
                <Layers size={18} className="text-slate-500 dark:text-slate-400" /> Today's Core
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {cores.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  No rotating classes scheduled today.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {cores.map(({ cls, subject }) => {
                    const c = colorOf(cls.color);
                    return (
                      <div
                        key={cls.id}
                        className={`flex items-center gap-3 rounded-xl border ${c.border} ${c.soft} ${c.softDark} p-3.5 dark:border-slate-700`}
                      >
                        <span className={`h-3 w-3 shrink-0 rounded-full ${c.dot}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            {cls.name}
                          </p>
                          <p className={`truncate text-base font-bold ${c.text} ${c.textDark}`}>
                            {subject}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
