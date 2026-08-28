'use client';
import { useEffect, useState } from 'react';

// Suit l'état RÉEL (résolu) du mode sombre du site — `html.dark` posé par
// ThemeProvider. Nécessaire pour le réglage "Thème de la fenêtre chat : suivre le
// thème du site", car les utilitaires Tailwind `dark:` ne peuvent pas être "annulés"
// pour un sous-arbre : un ancêtre `.dark` (ex: <html>) active toujours le sélecteur
// descendant `.dark .dark\:bg-x`, même si un enfant plus proche n'a pas cette classe.
// On calcule donc soi-même un booléen résolu et on l'applique via des classes
// explicites plutôt que via `dark:`.
export function useResolvedDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const compute = () => setIsDark(root.classList.contains('dark'));
    compute();
    const observer = new MutationObserver(compute);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
