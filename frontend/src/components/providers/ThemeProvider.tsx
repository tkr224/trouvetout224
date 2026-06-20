'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  // Lire le choix sauvegardé au montage
  useEffect(() => {
    const stored = localStorage.getItem('tt224-theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  // Appliquer la classe dark sur <html>
  useEffect(() => {
    const root = document.documentElement;
    const applyDark = () => root.classList.add('dark');
    const applyLight = () => root.classList.remove('dark');

    if (theme === 'dark')  { applyDark();  return; }
    if (theme === 'light') { applyLight(); return; }

    // 'system' : suit la préférence OS
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.matches ? applyDark() : applyLight();
    const listener = (e: MediaQueryListEvent) => e.matches ? applyDark() : applyLight();
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('tt224-theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
