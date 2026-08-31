export const COLOR_CLASSES: Record<string, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  soft: string;
  ring: string;
  softDark: string;
  textDark: string;
}> = {
  sky: { bg: 'bg-sky-500', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500', soft: 'bg-sky-50', ring: 'ring-sky-400', softDark: 'dark:bg-sky-950/40', textDark: 'dark:text-sky-300' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', soft: 'bg-emerald-50', ring: 'ring-emerald-400', softDark: 'dark:bg-emerald-950/40', textDark: 'dark:text-emerald-300' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', soft: 'bg-amber-50', ring: 'ring-amber-400', softDark: 'dark:bg-amber-950/40', textDark: 'dark:text-amber-300' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', soft: 'bg-rose-50', ring: 'ring-rose-400', softDark: 'dark:bg-rose-950/40', textDark: 'dark:text-rose-300' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', soft: 'bg-violet-50', ring: 'ring-violet-400', softDark: 'dark:bg-violet-950/40', textDark: 'dark:text-violet-300' },
  teal: { bg: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', soft: 'bg-teal-50', ring: 'ring-teal-400', softDark: 'dark:bg-teal-950/40', textDark: 'dark:text-teal-300' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', soft: 'bg-orange-50', ring: 'ring-orange-400', softDark: 'dark:bg-orange-950/40', textDark: 'dark:text-orange-300' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', soft: 'bg-indigo-50', ring: 'ring-indigo-400', softDark: 'dark:bg-indigo-950/40', textDark: 'dark:text-indigo-300' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', soft: 'bg-cyan-50', ring: 'ring-cyan-400', softDark: 'dark:bg-cyan-950/40', textDark: 'dark:text-cyan-300' },
  fuchsia: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-700', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500', soft: 'bg-fuchsia-50', ring: 'ring-fuchsia-400', softDark: 'dark:bg-fuchsia-950/40', textDark: 'dark:text-fuchsia-300' },
};

export function colorOf(color: string) {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.sky;
}
