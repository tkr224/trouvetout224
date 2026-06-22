'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';

export type ColorAccent =
  | 'green'         // Vert Guinée (défaut)
  | 'blue'          // Océan bleu
  | 'purple'        // Violet
  | 'orange'        // Coucher de soleil
  | 'red'           // Rouge Guinée
  | 'teal';         // Turquoise

export type SpecialTheme =
  | 'noel'          // Noël
  | 'ramadan'       // Ramadan
  | 'independence'  // Fête de l'indépendance Guinée
  | null;

// Thèmes disponibles avec leurs métadonnées (utilisé dans Settings + Admin)
export const COLOR_THEMES: {
  id: ColorAccent;
  label: string;
  emoji: string;
  hex: string;       // hex du shade-700 pour aperçu
  hexDark: string;
}[] = [
  { id: 'green',  label: 'Vert Guinée',          emoji: '🌿', hex: '#1B8B3B', hexDark: '#4ade80' },
  { id: 'blue',   label: 'Océan bleu',            emoji: '🌊', hex: '#1d4ed8', hexDark: '#93c5fd' },
  { id: 'purple', label: 'Violet',                emoji: '💜', hex: '#7e22ce', hexDark: '#d8b4fe' },
  { id: 'orange', label: 'Coucher de soleil',     emoji: '🌅', hex: '#c2410c', hexDark: '#fdba74' },
  { id: 'red',    label: 'Rouge Guinée',           emoji: '❤️', hex: '#be123c', hexDark: '#fda4af' },
  { id: 'teal',   label: 'Turquoise',             emoji: '🩵', hex: '#0f766e', hexDark: '#5eead4' },
];

export const SPECIAL_THEMES: {
  id: SpecialTheme & string;
  label: string;
  emoji: string;
  hex: string;
  description: string;
}[] = [
  { id: 'noel',         label: 'Noël',             emoji: '🎄', hex: '#991b1b', description: 'Rouge festif + banderole de Noël' },
  { id: 'ramadan',      label: 'Ramadan',           emoji: '🌙', hex: '#581c87', description: 'Violet profond + or + banderole Ramadan' },
  { id: 'independence', label: "Fête nationale 🇬🇳", emoji: '🦅', hex: '#1B8B3B', description: 'Tricolore guinéen + banderole festive' },
];

// ─── Clés localStorage ────────────────────────────────────────────────────────
const KEY_THEME   = 'tt224-theme';
const KEY_COLOR   = 'tt224-color';
const KEY_SPECIAL = 'tt224-special';

// ─── Contexte ─────────────────────────────────────────────────────────────────

interface ThemeContextType {
  // Mode clair/sombre
  theme:    Theme;
  setTheme: (t: Theme) => void;
  // Couleur d'accent
  colorAccent:    ColorAccent;
  setColorAccent: (c: ColorAccent) => void;
  // Thème spécial
  specialTheme:    SpecialTheme;
  setSpecialTheme: (s: SpecialTheme) => void;
  // Thème global imposé par l'admin (null = aucun)
  globalTheme: string | null;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system', setTheme: () => {},
  colorAccent: 'green', setColorAccent: () => {},
  specialTheme: null,   setSpecialTheme: () => {},
  globalTheme: null,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState]               = useState<Theme>('system');
  const [colorAccent, setColorAccentState]   = useState<ColorAccent>('green');
  const [specialTheme, setSpecialThemeState] = useState<SpecialTheme>(null);
  const [globalTheme, setGlobalTheme]        = useState<string | null>(null);

  // ── 1. Lecture des préférences sauvegardées ─────────────────────────
  useEffect(() => {
    const storedTheme   = localStorage.getItem(KEY_THEME)   as Theme | null;
    const storedColor   = localStorage.getItem(KEY_COLOR)   as ColorAccent | null;
    const storedSpecial = localStorage.getItem(KEY_SPECIAL) as SpecialTheme | null;

    const validThemes  = ['light', 'dark', 'system'];
    const validColors  = COLOR_THEMES.map(t => t.id);
    const validSpecial = [...SPECIAL_THEMES.map(t => t.id), null];

    if (storedTheme   && validThemes.includes(storedTheme))   setThemeState(storedTheme);
    if (storedColor   && validColors.includes(storedColor))   setColorAccentState(storedColor);
    if (validSpecial.includes(storedSpecial))                  setSpecialThemeState(storedSpecial);
  }, []);

  // ── 2. Thème global admin (récupéré depuis l'API) ───────────────────
  useEffect(() => {
    api.get('/site-config/theme')
      .then(r => {
        const gt = r.data?.globalTheme ?? null;
        setGlobalTheme(gt);
        // Appliquer le thème global SEULEMENT si l'utilisateur n'a pas de préférence locale
        if (gt && !localStorage.getItem(KEY_COLOR) && !localStorage.getItem(KEY_SPECIAL)) {
          const isSpecial = SPECIAL_THEMES.some(s => s.id === gt);
          if (isSpecial) {
            setSpecialThemeState(gt as SpecialTheme);
          } else {
            setColorAccentState(gt as ColorAccent);
          }
        }
      })
      .catch(() => {}); // silencieux si le backend est off
  }, []);

  // ── 3. Application du mode sombre ───────────────────────────────────
  useEffect(() => {
    const root     = document.documentElement;
    const applyDark  = () => root.classList.add('dark');
    const applyLight = () => root.classList.remove('dark');

    if (theme === 'dark')  { applyDark();  return; }
    if (theme === 'light') { applyLight(); return; }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.matches ? applyDark() : applyLight();
    const listener = (e: MediaQueryListEvent) => e.matches ? applyDark() : applyLight();
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  // ── 4. Application de la couleur d'accent ───────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    // Supprimer les anciens attributs couleur
    root.removeAttribute('data-color');
    // Thème spécial prend priorité sur l'accent de base
    if (specialTheme) {
      root.setAttribute('data-color', specialTheme);
    } else if (colorAccent && colorAccent !== 'green') {
      root.setAttribute('data-color', colorAccent);
    }
  }, [colorAccent, specialTheme]);

  // ── Setters publics ─────────────────────────────────────────────────

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(KEY_THEME, t);
  };

  const setColorAccent = (c: ColorAccent) => {
    setColorAccentState(c);
    setSpecialThemeState(null); // désactive le thème spécial si on choisit une couleur
    localStorage.setItem(KEY_COLOR, c);
    localStorage.removeItem(KEY_SPECIAL);
  };

  const setSpecialTheme = (s: SpecialTheme) => {
    setSpecialThemeState(s);
    if (s) {
      localStorage.setItem(KEY_SPECIAL, s);
      localStorage.removeItem(KEY_COLOR);
    } else {
      localStorage.removeItem(KEY_SPECIAL);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme, setTheme,
      colorAccent, setColorAccent,
      specialTheme, setSpecialTheme,
      globalTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
