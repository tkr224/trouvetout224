'use client';
import { useEffect } from 'react';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1200;

/**
 * Filet de sécurité site-wide : si une <img> échoue au chargement (SW/CDN/
 * réseau capricieux), on force un rechargement de CETTE image précise après
 * un court délai, sans recharger toute la page. `error` ne bulle pas sur les
 * <img>, d'où l'écoute en phase de capture au niveau document.
 */
export default function ImageAutoRetry() {
  useEffect(() => {
    const retries = new WeakMap<HTMLImageElement, number>();

    const onError = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (!target.src || target.src.startsWith('data:')) return;

      const attempt = retries.get(target) ?? 0;
      if (attempt >= MAX_RETRIES) return;
      retries.set(target, attempt + 1);

      const original = target.dataset.originalSrc || target.src.split('?__retry=')[0];
      target.dataset.originalSrc = original;

      window.setTimeout(() => {
        const separator = original.includes('?') ? '&' : '?';
        target.src = `${original}${separator}__retry=${Date.now()}`;
      }, RETRY_DELAY_MS * (attempt + 1));
    };

    document.addEventListener('error', onError, true);
    return () => document.removeEventListener('error', onError, true);
  }, []);

  return null;
}
