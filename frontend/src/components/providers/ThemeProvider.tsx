'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';

export type ColorAccent =
  | 'green'         // Vert Guinée (défaut)
  | 'blue'          // Océan bleu
  | 'purple'        // Violet
  | 'orange'        // Coucher de soleil
  | 'red'           // Rouge Guinée
  | 'teal'          // Turquoise
  | 'royal'         // Violet royal / améthyste
  | 'feu'           // Feu (rouge-orange ardent)
  | 'nuit'          // Nuit étoilée (indigo profond)
  | 'minimaliste'   // Minimaliste (ardoise / gris)
  | 'terre'         // Terre (brun / terracotta)
  | 'animated'      // Animé / 3D (cyan + effets CSS)
  // ── Thèmes premium / réservés (isSpecial: true) ──
  | 'neon'          // Néon / Cyberpunk
  | 'valentine'     // Saint-Valentin
  | 'halloween'     // Halloween
  | 'luxe'          // Luxe / Gold
  | 'retro'         // Rétro / Vintage
  | 'ocean'         // Océan profond
  | 'foret'         // Forêt
  | 'galaxie'       // Galaxie / Espace
  | 'lave'          // Feu / Lave
  | 'pluie'         // Pluie
  | 'arcenciel'     // Arc-en-ciel
  | 'glace'         // Glace / Hiver
  | 'orliquide'     // Or liquide
  // ── Pack premium — 8 nouveaux thèmes ──
  | 'aurore'        // Aurore boréale
  | 'sakura'        // Sakura
  | 'matrix'        // Matrix / Hacker
  | 'bonbon'        // Bonbon / Candy
  | 'volcan'        // Volcan
  | 'orage'         // Orage / Tonnerre
  | 'desert'        // Désert
  | 'cristal';      // Cristal

export type SpecialTheme =
  | 'noel'          // Noël
  | 'ramadan'       // Ramadan
  | 'independence'  // Fête de l'indépendance Guinée
  | null;

// Thèmes disponibles avec leurs métadonnées
export const COLOR_THEMES: {
  id: ColorAccent;
  label: string;
  emoji: string;
  hex: string;       // couleur pour aperçu en mode clair
  hexDark: string;   // couleur pour aperçu en mode sombre
  isSpecial?: boolean; // true = réservé, nécessite un accès admin
}[] = [
  // ── Thèmes de BASE (libres pour tous) ──
  { id: 'green',       label: 'Vert Guinée',       emoji: '🌿', hex: '#1B8B3B', hexDark: '#4ade80' },
  { id: 'blue',        label: 'Océan bleu',         emoji: '🌊', hex: '#1d4ed8', hexDark: '#93c5fd' },
  { id: 'purple',      label: 'Violet',             emoji: '💜', hex: '#7e22ce', hexDark: '#d8b4fe' },
  { id: 'orange',      label: 'Coucher de soleil',  emoji: '🌅', hex: '#c2410c', hexDark: '#fdba74' },
  { id: 'red',         label: 'Rouge Guinée',        emoji: '❤️', hex: '#be123c', hexDark: '#fda4af' },
  { id: 'teal',        label: 'Turquoise',          emoji: '🩵', hex: '#0f766e', hexDark: '#5eead4' },
  { id: 'royal',       label: 'Royal',              emoji: '👑', hex: '#6D28D9', hexDark: '#c4b5fd' },
  { id: 'feu',         label: 'Feu',                emoji: '🔥', hex: '#C43000', hexDark: '#ff9b6b' },
  { id: 'nuit',        label: 'Nuit étoilée',       emoji: '🌙', hex: '#4338CA', hexDark: '#a5b4fc' },
  { id: 'minimaliste', label: 'Minimaliste',        emoji: '💎', hex: '#334155', hexDark: '#cbd5e1' },
  { id: 'terre',       label: 'Terre',              emoji: '🍫', hex: '#A04016', hexDark: '#f0b994' },
  { id: 'animated',    label: 'Animé / 3D',         emoji: '✨', hex: '#0E7490', hexDark: '#67e8f9' },

  // ── Thèmes SPÉCIAUX (réservés, déblocage admin) ──
  { id: 'neon',      label: 'Néon / Cyberpunk',  emoji: '🔮', hex: '#00b4d8', hexDark: '#00e5ff', isSpecial: true },
  { id: 'valentine', label: 'Saint-Valentin',     emoji: '💕', hex: '#be0850', hexDark: '#ff8fb4', isSpecial: true },
  { id: 'halloween', label: 'Halloween',          emoji: '🎃', hex: '#a03a04', hexDark: '#ff9442', isSpecial: true },
  { id: 'luxe',      label: 'Luxe / Gold',        emoji: '🥂', hex: '#96600a', hexDark: '#d4af37', isSpecial: true },
  { id: 'retro',     label: 'Rétro / Vintage',    emoji: '📻', hex: '#69086c', hexDark: '#e890e8', isSpecial: true },
  { id: 'ocean',     label: 'Océan profond',      emoji: '🌊', hex: '#0369a1', hexDark: '#38bdf8', isSpecial: true },
  { id: 'foret',     label: 'Forêt',              emoji: '🌲', hex: '#166534', hexDark: '#4ade80', isSpecial: true },
  { id: 'galaxie',   label: 'Galaxie',            emoji: '🌌', hex: '#4c1d95', hexDark: '#a78bfa', isSpecial: true },
  { id: 'lave',      label: 'Feu / Lave',         emoji: '🌋', hex: '#9a1f00', hexDark: '#fb923c', isSpecial: true },
  { id: 'pluie',     label: 'Pluie',              emoji: '🌧️', hex: '#1e3a5f', hexDark: '#93c5fd', isSpecial: true },
  { id: 'arcenciel', label: 'Arc-en-ciel',        emoji: '🌈', hex: '#7c3aed', hexDark: '#c4b5fd', isSpecial: true },
  { id: 'glace',     label: 'Glace / Hiver',      emoji: '❄️', hex: '#0c4a6e', hexDark: '#bae6fd', isSpecial: true },
  { id: 'orliquide', label: 'Or liquide',         emoji: '✨', hex: '#92400e', hexDark: '#fde68a', isSpecial: true },
  // ── Pack premium — 8 nouveaux thèmes ──
  { id: 'aurore',  label: 'Aurore boréale',  emoji: '🌌', hex: '#065f46', hexDark: '#34d399', isSpecial: true },
  { id: 'sakura',  label: 'Sakura',          emoji: '🌸', hex: '#9d174d', hexDark: '#f9a8d4', isSpecial: true },
  { id: 'matrix',  label: 'Matrix',          emoji: '💻', hex: '#14532d', hexDark: '#4ade80', isSpecial: true },
  { id: 'bonbon',  label: 'Bonbon / Candy',  emoji: '🍬', hex: '#be185d', hexDark: '#fbcfe8', isSpecial: true },
  { id: 'volcan',  label: 'Volcan',          emoji: '🌋', hex: '#7f1d1d', hexDark: '#f87171', isSpecial: true },
  { id: 'orage',   label: 'Orage / Tonnerre',emoji: '⚡', hex: '#1e3a5f', hexDark: '#fde047', isSpecial: true },
  { id: 'desert',  label: 'Désert',          emoji: '🏜️', hex: '#b45309', hexDark: '#fcd34d', isSpecial: true },
  { id: 'cristal', label: 'Cristal',         emoji: '💎', hex: '#0891b2', hexDark: '#a5f3fc', isSpecial: true },
];

export const SPECIAL_THEMES: {
  id: SpecialTheme & string;
  label: string;
  emoji: string;
  hex: string;
  description: string;
}[] = [
  { id: 'noel',         label: 'Noël',             emoji: '🎄', hex: '#991b1b', description: 'Rouge/vert festif · flocons de neige animés ❄️' },
  { id: 'ramadan',      label: 'Ramadan',           emoji: '🌙', hex: '#581c87', description: 'Violet/or chaud · croissant + étoiles ✨' },
  { id: 'independence', label: "Fête nationale 🇬🇳", emoji: '🦅', hex: '#1B8B3B', description: 'Tricolore guinéen · confettis patriotiques 🎊' },
];

// ─── Clés localStorage ────────────────────────────────────────────────────────
const KEY_THEME   = 'tt224-theme';
const KEY_COLOR   = 'tt224-color';
const KEY_SPECIAL = 'tt224-special';

// ─── Contexte ─────────────────────────────────────────────────────────────────

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  colorAccent: ColorAccent;
  setColorAccent: (c: ColorAccent) => void;
  specialTheme: SpecialTheme;
  setSpecialTheme: (s: SpecialTheme) => void;
  globalTheme: string | null;
  isThemeLocked: (themeId: string) => boolean;
  unlockedSpecialThemes: string[]; // thèmes spéciaux auxquels l'utilisateur a accès
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system', setTheme: () => {},
  colorAccent: 'green', setColorAccent: () => {},
  specialTheme: null,   setSpecialTheme: () => {},
  globalTheme: null,
  isThemeLocked: () => false,
  unlockedSpecialThemes: [],
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState]               = useState<Theme>('system');
  const [colorAccent, setColorAccentState]   = useState<ColorAccent>('green');
  const [specialTheme, setSpecialThemeState] = useState<SpecialTheme>(null);
  const [globalTheme, setGlobalTheme]        = useState<string | null>(null);
  const [unlockedSpecialThemes, setUnlocked] = useState<string[]>([]);

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

  // ── 2. Thème global + accès utilisateur (depuis l'API) ──────────────
  useEffect(() => {
    api.get('/site-config/theme')
      .then(r => {
        const gt                  = r.data?.globalTheme ?? null;
        const siteThemes: string[] = r.data?.siteSpecialThemes ?? [];
        const userThemes: string[] = r.data?.userSpecialThemes ?? [];

        setGlobalTheme(gt);

        // Combiner : accès site-wide + accès utilisateur
        const combined = Array.from(new Set([...siteThemes, ...userThemes]));
        setUnlocked(combined);

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
    root.removeAttribute('data-color');
    if (specialTheme) {
      root.setAttribute('data-color', specialTheme);
    } else if (colorAccent && colorAccent !== 'green') {
      root.setAttribute('data-color', colorAccent);
    }
  }, [colorAccent, specialTheme]);

  // ── isThemeLocked : vérifie si un thème nécessite un accès ──────────
  const isThemeLocked = useCallback((themeId: string): boolean => {
    const colorTheme  = COLOR_THEMES.find(t => t.id === themeId);
    const specialThem = SPECIAL_THEMES.find(t => t.id === themeId);
    const needsAccess = colorTheme?.isSpecial === true || !!specialThem;
    if (!needsAccess) return false; // thème de base = toujours libre

    if (unlockedSpecialThemes.includes('__all__')) return false; // admin
    return !unlockedSpecialThemes.includes(themeId);
  }, [unlockedSpecialThemes]);

  // ── Setters publics ─────────────────────────────────────────────────

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(KEY_THEME, t);
  };

  const setColorAccent = (c: ColorAccent) => {
    setColorAccentState(c);
    setSpecialThemeState(null);
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
      isThemeLocked,
      unlockedSpecialThemes,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
