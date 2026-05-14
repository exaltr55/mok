import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dawn' | 'sage' | 'twilight';

const THEMES: Theme[] = ['dawn', 'sage', 'twilight'];
const STORAGE_KEY = 'mok_theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  available: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitial(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (THEMES as string[]).includes(stored)) return stored as Theme;
  // Fall back to OS preference: dark → twilight, light → dawn.
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'twilight';
  return 'dawn';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme: setThemeState, available: THEMES }),
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
