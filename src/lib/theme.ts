import { useEffect } from 'react';
import type { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

export function applyDarkMode(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) root.classList.add('dark');
  else root.classList.remove('dark');
}

export function useDarkMode(settings: Settings | null) {
  useEffect(() => {
    applyDarkMode(settings?.dark_mode ?? DEFAULT_SETTINGS.dark_mode);
  }, [settings?.dark_mode]);
}
