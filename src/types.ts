export type ClassType = 'fixed' | 'rotating';

export interface ClassEntry {
  id: string;
  name: string;
  type: ClassType;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  weekday: number | null; // 0=Sun..6=Sat, null for rotating
  color: string;
  rotation_subjects: string[] | null;
  rotation_start_date: string | null; // "YYYY-MM-DD"
  rotation_period_days: number;
  user_id: string;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  dark_mode: boolean;
  show_end_of_class_countdown: boolean;
  show_semester_countdown: boolean;
  semester_end_date: string; // "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  dark_mode: true,
  show_end_of_class_countdown: true,
  show_semester_countdown: true,
  semester_end_date: '2027-05-20',
};

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const COLOR_OPTIONS = [
  'sky',
  'emerald',
  'amber',
  'rose',
  'violet',
  'teal',
  'orange',
  'indigo',
  'cyan',
  'fuchsia',
];
