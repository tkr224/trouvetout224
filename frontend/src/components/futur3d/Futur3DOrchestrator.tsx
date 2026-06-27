'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth.store';

// Chargement paresseux — les librairies lourdes ne sont téléchargées
// que quand l'admin active le thème futur3d.
const Futur3DBackground = dynamic(() => import('./Futur3DBackground'), { ssr: false });
const Futur3DCursor     = dynamic(() => import('./Futur3DCursor'),     { ssr: false });
const Futur3DHUD        = dynamic(() => import('./Futur3DHUD'),        { ssr: false });

// ── Effet inclinaison 3D des cartes (réactif à la souris) ───────────
function useCardTilt(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const SELECTORS = '.card, .annonce-card';
    const cleanups: (() => void)[] = [];

    function attachTilt(el: HTMLElement): () => void {
      if (el.dataset.f3dTilt) return () => {};
      el.dataset.f3dTilt = '1';
      el.style.willChange = 'transform';

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const mx   = ((e.clientX - rect.left) / rect.width)  * 100;
        const my   = ((e.clientY - rect.top)  / rect.height) * 100;
        const x    = (mx / 100 - 0.5) * 2;
        const y    = (my / 100 - 0.5) * 2;
        el.style.transform  = `perspective(900px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) translateZ(18px) scale(1.025)`;
        el.style.transition = 'transform 0.08s ease';
        el.style.setProperty('--mx', `${mx}%`);
        el.style.setProperty('--my', `${my}%`);
      };

      const onLeave = () => {
        el.style.transform  = '';
        el.style.transition = 'transform 0.7s cubic-bezier(.23,1.02,.32,1)';
        el.style.setProperty('--mx', '50%');
        el.style.setProperty('--my', '50%');
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);

      return () => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
        el.style.transform  = '';
        el.style.transition = '';
        el.style.willChange = '';
        delete el.dataset.f3dTilt;
      };
    }

    // Cartes déjà présentes au chargement
    document.querySelectorAll<HTMLElement>(SELECTORS).forEach(el => {
      cleanups.push(attachTilt(el));
    });

    // Surveillance des nouvelles cartes (navigation, pagination)
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.(SELECTORS)) cleanups.push(attachTilt(node));
          node.querySelectorAll<HTMLElement>(SELECTORS).forEach(el => cleanups.push(attachTilt(el)));
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cleanups.forEach(fn => fn());
      observer.disconnect();
    };
  }, [active]);
}

// ── Orchestrateur principal ──────────────────────────────────────────
export default function Futur3DOrchestrator() {
  const { colorAccent }      = useTheme();
  const { user, _hasHydrated } = useAuthStore();

  const isAdmin  = _hasHydrated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN');
  const isActive = colorAccent === 'futur3d' && isAdmin;

  useCardTilt(isActive);

  if (!isActive) return null;

  return (
    <>
      <Futur3DBackground />
      <Futur3DCursor />
      <Futur3DHUD />
    </>
  );
}
