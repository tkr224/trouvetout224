'use client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Retourne à la page précédente si l'utilisateur a réellement navigué depuis
// une autre page de TrouveTout224 (vérifié via document.referrer), sinon
// renvoie vers fallbackHref — le cas d'un utilisateur arrivé directement sur
// la page (lien partagé, nouvel onglet, favori...) où window.history.back()
// n'aurait aucun effet utile ou quitterait le site.
export function useSmartBack(fallbackHref: string) {
  const router = useRouter();

  return useCallback(() => {
    let cameFromSameSite = false;
    if (typeof document !== 'undefined' && document.referrer) {
      try {
        cameFromSameSite = new URL(document.referrer).origin === window.location.origin;
      } catch {
        cameFromSameSite = false;
      }
    }
    if (cameFromSameSite && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }, [router, fallbackHref]);
}
