import { useEffect, useState } from 'react';
import { X, Moon, Timer, CalendarClock, LogOut } from 'lucide-react';
import type { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { supabase } from '@/lib/supabase';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings | null;
  onSaved: () => void;
  onSignOut: () => void;
}

export default function SettingsModal({
  open,
  onClose,
  settings,
  onSaved,
  onSignOut,
}: SettingsModalProps) {
  const [darkMode, setDarkMode] = useState(DEFAULT_SETTINGS.dark_mode);
  const [showEndCountdown, setShowEndCountdown] = useState(
    DEFAULT_SETTINGS.show_end_of_class_countdown,
  );
  const [showSemesterCountdown, setShowSemesterCountdown] = useState(
    DEFAULT_SETTINGS.show_semester_countdown,
  );
  const [semesterEndDate, setSemesterEndDate] = useState(
    DEFAULT_SETTINGS.semester_end_date,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && settings) {
      setDarkMode(settings.dark_mode);
      setShowEndCountdown(settings.show_end_of_class_countdown);
      setShowSemesterCountdown(settings.show_semester_countdown);
      setSemesterEndDate(settings.semester_end_date);
      setError(null);
    }
  }, [open, settings]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      dark_mode: darkMode,
      show_end_of_class_countdown: showEndCountdown,
      show_semester_countdown: showSemesterCountdown,
      semester_end_date: semesterEndDate,
    };

    let result;
    if (settings) {
      result = await supabase.from('settings').update(payload).eq('id', settings.id).select();
    } else {
      result = await supabase.from('settings').insert(payload).select();
    }
    setSaving(false);

    if (result.error) {
      setError('Could not save settings. Please try again.');
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Dark mode */}
            <ToggleRow
              icon={<Moon size={18} />}
              title="Dark mode"
              description="Switch to a darker color scheme."
              checked={darkMode}
              onChange={setDarkMode}
            />

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* End of class countdown */}
            <ToggleRow
              icon={<Timer size={18} />}
              title="End-of-class countdown"
              description="Show a live countdown to the end of your current class."
              checked={showEndCountdown}
              onChange={setShowEndCountdown}
            />

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Semester countdown */}
            <div>
              <ToggleRow
                icon={<CalendarClock size={18} />}
                title="Semester countdown"
                description="Show a countdown to a target date (default: May 20)."
                checked={showSemesterCountdown}
                onChange={setShowSemesterCountdown}
              />
              {showSemesterCountdown && (
                <div className="mt-3 pl-[34px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Target date
                  </label>
                  <input
                    type="date"
                    value={semesterEndDate}
                    onChange={(e) => setSemesterEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-slate-700"
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <LogOut size={16} /> Sign out
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-slate-800 dark:bg-slate-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}
