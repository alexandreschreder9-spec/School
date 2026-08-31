import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Clock, Repeat, Calendar as CalendarIcon } from 'lucide-react';
import type { ClassEntry, ClassType } from '@/types';
import { WEEKDAYS, WEEKDAYS_SHORT, COLOR_OPTIONS } from '@/types';
import { colorOf } from '@/lib/colors';
import { supabase } from '@/lib/supabase';

interface AddClassModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: ClassEntry | null;
}

function toTimeInput(time: string): string {
  return time.slice(0, 5);
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
    .getDate()
    .toString()
    .padStart(2, '0')}`;
}

export default function AddClassModal({ open, onClose, onSaved, editing }: AddClassModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ClassType>('fixed');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [weekday, setWeekday] = useState(1);
  const [color, setColor] = useState('sky');
  const [subjects, setSubjects] = useState<string[]>(['']);
  const [rotationStartDate, setRotationStartDate] = useState(todayDateStr());
  const [rotationPeriodDays, setRotationPeriodDays] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setType(editing.type);
        setStartTime(toTimeInput(editing.start_time));
        setEndTime(toTimeInput(editing.end_time));
        setWeekday(editing.weekday ?? 1);
        setColor(editing.color);
        setSubjects(editing.rotation_subjects?.length ? editing.rotation_subjects : ['']);
        setRotationStartDate(editing.rotation_start_date ?? todayDateStr());
        setRotationPeriodDays(editing.rotation_period_days ?? 1);
      } else {
        setName('');
        setType('fixed');
        setStartTime('08:00');
        setEndTime('09:00');
        setWeekday(1);
        setColor('sky');
        setSubjects(['']);
        setRotationStartDate(todayDateStr());
        setRotationPeriodDays(1);
      }
      setError(null);
    }
  }, [open, editing]);

  if (!open) return null;

  const handleAddSubject = () => setSubjects((s) => [...s, '']);
  const handleRemoveSubject = (i: number) =>
    setSubjects((s) => s.filter((_, idx) => idx !== i));
  const handleSubjectChange = (i: number, val: string) =>
    setSubjects((s) => s.map((subj, idx) => (idx === i ? val : subj)));

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter a class name.');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    if (type === 'rotating') {
      const cleaned = subjects.map((s) => s.trim()).filter(Boolean);
      if (cleaned.length === 0) {
        setError('Add at least one subject for the rotation.');
        return;
      }
      if (!rotationStartDate) {
        setError('Pick a start date for the rotation.');
        return;
      }
      if (rotationPeriodDays < 1) {
        setError('Rotation period must be at least 1 day.');
        return;
      }
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      type,
      start_time: startTime + ':00',
      end_time: endTime + ':00',
      weekday: type === 'fixed' ? weekday : null,
      color,
      rotation_subjects: type === 'rotating' ? subjects.map((s) => s.trim()).filter(Boolean) : null,
      rotation_start_date: type === 'rotating' ? rotationStartDate : null,
      rotation_period_days: type === 'rotating' ? rotationPeriodDays : 1,
    };

    let result;
    if (editing) {
      result = await supabase.from('classes').update(payload).eq('id', editing.id).select();
    } else {
      result = await supabase.from('classes').insert(payload).select();
    }
    setSaving(false);

    if (result.error) {
      setError('Could not save the class. Please try again.');
      return;
    }
    onSaved();
    onClose();
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-slate-700';
  const labelClass =
    'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {editing ? 'Edit class' : 'Add a class'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Type toggle */}
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setType('fixed')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                type === 'fixed'
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <CalendarIcon size={16} /> Fixed
            </button>
            <button
              onClick={() => setType('rotating')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                type === 'rotating'
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Repeat size={16} /> Rotating
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Class name</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Math, Science, English"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start time</label>
                <input
                  type="time"
                  className={inputClass}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>End time</label>
                <input
                  type="time"
                  className={inputClass}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {type === 'fixed' ? (
              <div>
                <label className={labelClass}>Day of the week</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS_SHORT.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => setWeekday(i)}
                      className={`rounded-lg py-2 text-xs font-semibold transition ${
                        weekday === i
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{WEEKDAYS[weekday]}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className={labelClass}>Rotation subjects</label>
                  <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
                    Add the subjects that cycle through this class, in order. The current one
                    is shown on the "today's core" button.
                  </p>
                  <div className="space-y-2">
                    {subjects.map((subj, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                          {i + 1}
                        </span>
                        <input
                          className={inputClass}
                          value={subj}
                          onChange={(e) => handleSubjectChange(i, e.target.value)}
                          placeholder={`Subject ${i + 1}`}
                        />
                        {subjects.length > 1 && (
                          <button
                            onClick={() => handleRemoveSubject(i)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddSubject}
                    className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Plus size={16} /> Add subject
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Rotation starts</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={rotationStartDate}
                      onChange={(e) => setRotationStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Days per subject</label>
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={rotationPeriodDays}
                      onChange={(e) =>
                        setRotationPeriodDays(Math.max(1, Number(e.target.value) || 1))
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Color label</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full ${colorOf(c).bg} transition ${
                      color === c
                        ? `ring-2 ring-offset-2 ${colorOf(c).ring} dark:ring-offset-slate-900`
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Clock size={16} />
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add class'}
          </button>
        </div>
      </div>
    </div>
  );
}
