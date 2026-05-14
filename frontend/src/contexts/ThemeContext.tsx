import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/** All themes currently available. */
export type Theme = 'stillwater' | 'sunbeam' | 'cobalt' | 'sage' | 'twilight';

interface ThemeOption {
  id: Theme;
  label: string;
  hint: string;
}

/**
 * The user-facing list, in the order the Settings picker should show them.
 *   - Stillwater — default, calming slate-blue
 *   - Sunbeam    — warm yellow / amber, happy
 *   - Cobalt     — vibrant royal blue
 *   - Sage       — cooler teal-slate
 *   - Twilight   — midnight dark mode
 */
export const THEME_OPTIONS: readonly ThemeOption[] = [
  { id: 'stillwater', label: 'Stillwater', hint: 'Calm slate blue' },
  { id: 'sunbeam',    label: 'Sunbeam',    hint: 'Warm amber morning' },
  { id: 'cobalt',     label: 'Cobalt',     hint: 'Vibrant royal blue' },
  { id: 'sage',       label: 'Sage',       hint: 'Cool teal-slate' },
  { id: 'twilight',   label: 'Twilight',   hint: 'Midnight dark' },
] as const;

const THEME_IDS = THEME_OPTIONS.map((o) => o.id) as readonly Theme[];
const STORAGE_KEY = 'mok_theme';

/** Legacy theme names that have been renamed or merged into a current theme. */
const LEGACY_ALIASES: Record<string, Theme> = {
  dawn: 'stillwater',
  bone: 'stillwater',
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  available: readonly Theme[];
  options: readonly ThemeOption[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitial(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const aliased = LEGACY_ALIASES[stored];
    if (aliased) return aliased;
    if ((THEME_IDS as readonly string[]).includes(stored)) return stored as Theme;
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'twilight';
  return 'stillwater';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      available: THEME_IDS,
      options: THEME_OPTIONS,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
