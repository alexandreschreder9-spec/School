import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Settings as SettingsIcon,
  Timer,
  CalendarClock,
} from 'lucide-react';
import type { ClassEntry, Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { WEEKDAYS } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth, AuthProvider } from '@/lib/auth';
import { useDarkMode } from '@/lib/theme';
import { getClassesForDay, getRotatingSubject, getClassStatus, parseTimeToMinutes, nowMinutes } from '@/lib/time';
import { colorOf } from '@/lib/colors';
import AddClassModal from '@/components/AddClassModal';
import ClassCard from '@/components/ClassCard';
import CoreButton from '@/components/CoreButton';
import SettingsModal from '@/components/SettingsModal';
import AuthScreen from '@/components/AuthScreen';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function AppInner() {
  const { session, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState<ClassEntry | null>(null);

  useDarkMode(settings);

  const loadClasses = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('start_time', { ascending: true });
    if (error) {
      setError('Could not load your classes.');
      return;
    }
    setClasses(data ?? []);
    setError(null);
  }, [session]);

  const loadSettings = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error) {
      // non-fatal; fall back to defaults
      setSettings(null);
      return;
    }
    setSettings(data);
  }, [session]);

  useEffect(() => {
    if (!session) {
      setClasses([]);
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([loadClasses(), loadSettings()]).finally(() => setLoading(false));
  }, [session, loadClasses, loadSettings]);

  // live ticking every second for countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todaysClasses = useMemo(
    () => getClassesForDay(classes, selectedDate),
    [classes, selectedDate],
  );

  const isToday = isSameDay(selectedDate, now);

  const activeClass = useMemo(() => {
    if (!isToday) return null;
    return todaysClasses.find((c) => getClassStatus(c, now) === 'active') ?? null;
  }, [todaysClasses, isToday, now]);

  const nextClass = useMemo(() => {
    if (!isToday) return null;
    return todaysClasses.find((c) => getClassStatus(c, now) === 'upcoming') ?? null;
  }, [todaysClasses, isToday, now]);

  // Active class progress (ms-based for precision)
  const classProgress = useMemo(() => {
    if (!activeClass || !isToday) return null;
    const startM = parseTimeToMinutes(activeClass.start_time);
    const endM = parseTimeToMinutes(activeClass.end_time);
    const nowM = nowMinutes(now);
    if (nowM < startM || nowM >= endM) return null;
    const startDate = new Date(now);
    startDate.setHours(Math.floor(startM / 60), startM % 60, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(Math.floor(endM / 60), endM % 60, 0, 0);
    const totalMs = endDate.getTime() - startDate.getTime();
    const elapsedMs = now.getTime() - startDate.getTime();
    const remainingMs = endDate.getTime() - now.getTime();
    const percent = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;
    return { totalMs, elapsedMs, remainingMs, percent };
  }, [activeClass, isToday, now]);

  // End-of-class countdown (ms remaining)
  const endOfClassMs = useMemo(() => {
    if (!activeClass || !isToday) return null;
    const end = parseTimeToMinutes(activeClass.end_time);
    const nowM = nowMinutes(now);
    const remainingMin = end - nowM;
    if (remainingMin <= 0) return null;
    // approximate to ms using today's date
    const endDate = new Date(now);
    endDate.setHours(Math.floor(end / 60), end % 60, 0, 0);
    return endDate.getTime() - now.getTime();
  }, [activeClass, isToday, now]);

  // Semester countdown
  const semesterMs = useMemo(() => {
    const target = settings?.semester_end_date ?? DEFAULT_SETTINGS.semester_end_date;
    const targetDate = new Date(target + 'T00:00:00');
    return targetDate.getTime() - now.getTime();
  }, [settings, now]);

  const showEndCountdown = settings?.show_end_of_class_countdown ?? DEFAULT_SETTINGS.show_end_of_class_countdown;
  const showSemesterCountdown =
    settings?.show_semester_countdown ?? DEFAULT_SETTINGS.show_semester_countdown;

  const handleEdit = (cls: ClassEntry) => {
    setEditing(cls);
    setModalOpen(true);
  };

  const handleDelete = async (cls: ClassEntry) => {
    if (!confirm(`Delete "${cls.name}"? This can't be undone.`)) return;
    const { error } = await supabase.from('classes').delete().eq('id', cls.id);
    if (error) {
      setError('Could not delete the class.');
      return;
    }
    await loadClasses();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSettingsOpen(false);
  };

  const weekStrip = useMemo(() => {
    const start = startOfDay(now);
    const days: Date[] = [];
    for (let i = -2; i <= 4; i++) days.push(addDays(start, i));
    return days;
  }, [now]);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Clock className="animate-pulse text-slate-400" size={28} />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white dark:bg-slate-700">
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-800 dark:text-white">
                Class Countdown
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {WEEKDAYS[selectedDate.getDay()]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <SettingsIcon size={18} />
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <Plus size={16} /> Add class
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6">
        {/* Big countdown display */}
        {isToday && classProgress && activeClass && (
          <BigCountdown
            cls={activeClass}
            now={now}
            progress={classProgress}
          />
        )}

        {/* Countdowns */}
        {(showEndCountdown || showSemesterCountdown) && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {showEndCountdown && (
              <CountdownCard
                icon={<Timer size={18} />}
                label={activeClass ? `End of ${activeClass.name}` : 'No class right now'}
                value={endOfClassMs !== null ? formatDuration(endOfClassMs) : '—'}
                accent="emerald"
                active={endOfClassMs !== null}
              />
            )}
            {showSemesterCountdown && (
              <CountdownCard
                icon={<CalendarClock size={18} />}
                label={`Until ${formatDateShort(settings?.semester_end_date ?? DEFAULT_SETTINGS.semester_end_date)}`}
                value={semesterMs > 0 ? formatDuration(semesterMs) : 'Reached!'}
                accent="sky"
                active={semesterMs > 0}
              />
            )}
          </div>
        )}

        {/* Week strip */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          {weekStrip.map((d) => {
            const selected = isSameDay(d, selectedDate);
            const today = isSameDay(d, now);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(d)}
                className={`flex min-w-[58px] shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-2.5 transition ${
                  selected
                    ? 'bg-slate-800 text-white shadow-sm dark:bg-slate-700'
                    : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                  {WEEKDAYS[d.getDay()].slice(0, 3)}
                </span>
                <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                {today && (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      selected ? 'bg-white' : 'bg-slate-800 dark:bg-slate-300'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Date nav */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{greeting}</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {isToday
                ? "Here's your schedule for today"
                : `Schedule for ${WEEKDAYS[selectedDate.getDay()]}`}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={18} />
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Today
              </button>
            )}
            <button
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Live status banner */}
        {isToday && (activeClass || nextClass) && (
          <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-5 text-white shadow-md dark:from-slate-800 dark:to-slate-900">
            {activeClass ? (
              <ActiveBanner cls={activeClass} now={now} />
            ) : (
              <NextBanner cls={nextClass!} now={now} />
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Class list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <Clock className="mb-2 animate-pulse" size={28} />
            <p className="text-sm">Loading your classes…</p>
          </div>
        ) : todaysClasses.length === 0 ? (
          <EmptyState onAdd={() => setModalOpen(true)} />
        ) : (
          <div className="space-y-3">
            {todaysClasses.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                date={isToday ? now : selectedDate}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <CoreButton classes={classes} date={now} />

      <AddClassModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={loadClasses}
        editing={editing}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaved={loadSettings}
        onSignOut={handleSignOut}
      />
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CountdownCard({
  icon,
  label,
  value,
  accent,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'emerald' | 'sky';
  active: boolean;
}) {
  const accentClasses =
    accent === 'emerald'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
      : 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400';
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentClasses}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className={`text-lg font-bold tabular-nums ${active ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function formatMS(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatHMS(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function BigCountdown({
  cls,
  now,
  progress,
}: {
  cls: ClassEntry;
  now: Date;
  progress: { totalMs: number; elapsedMs: number; remainingMs: number; percent: number };
}) {
  const subject = getRotatingSubject(cls, now);
  const c = colorOf(cls.color);
  const remaining = formatMS(progress.remainingMs);
  const elapsed = formatHMS(progress.elapsedMs);
  const total = formatHMS(progress.totalMs);
  const pct = Math.round(progress.percent);

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-7">
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${c.dot}`} />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{cls.name}</p>
            {subject && (
              <p className={`text-xs font-semibold ${c.text} ${c.textDark}`}>{subject}</p>
            )}
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          In progress
        </span>
      </div>

      {/* Big number */}
      <div className="px-5 pt-4 text-center sm:px-7">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Time remaining
        </p>
        <p className="text-6xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-white sm:text-7xl">
          {remaining}
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-5 sm:px-7">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`absolute left-0 top-0 h-full rounded-full ${c.bg} transition-all duration-1000 ease-linear`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold tabular-nums">
          <span className="text-slate-500 dark:text-slate-400">{elapsed} elapsed</span>
          <span className={`text-slate-700 dark:text-slate-200`}>{pct}% done</span>
          <span className="text-slate-500 dark:text-slate-400">{total} total</span>
        </div>
      </div>

      {/* Done / left split */}
      <div className="mt-4 grid grid-cols-2 border-t border-slate-100 dark:border-slate-800">
        <div className="border-r border-slate-100 px-5 py-4 text-center sm:px-7 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Done
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-800 dark:text-white">
            {pct}%
          </p>
        </div>
        <div className="px-5 py-4 text-center sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Left
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-800 dark:text-white">
            {100 - pct}%
          </p>
        </div>
      </div>
    </div>
  );
}

function ActiveBanner({ cls, now }: { cls: ClassEntry; now: Date }) {
  const subject = getRotatingSubject(cls, now);
  const c = colorOf(cls.color);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
        In class now
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold">{cls.name}</h3>
        {subject && <span className="text-lg font-semibold text-slate-300">· {subject}</span>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
        <p className="text-sm text-slate-300">
          Ends at {formatTime12(cls.end_time)} — class is in progress.
        </p>
      </div>
    </div>
  );
}

function NextBanner({ cls, now }: { cls: ClassEntry; now: Date }) {
  const subject = getRotatingSubject(cls, now);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">Up next</p>
      <div className="mt-1 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold">{cls.name}</h3>
        {subject && <span className="text-lg font-semibold text-slate-300">· {subject}</span>}
      </div>
      <p className="mt-3 text-sm text-slate-300">Starts at {formatTime12(cls.start_time)}. Get ready!</p>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <CalendarDays size={28} />
      </div>
      <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No classes scheduled</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-400 dark:text-slate-500">
        Add your first class — fixed or rotating — to start tracking your day.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        <Plus size={16} /> Add a class
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
