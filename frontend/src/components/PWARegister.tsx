'use client';
import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Un nouveau service worker (skipWaiting + clients.claim côté sw.js) peut
    // prendre le contrôle d'un onglet déjà ouvert sans que sa page ne soit
    // rechargée. Sans ce recharger forcé, l'onglet continue d'exécuter le
    // vieux JS/état pendant que les futures requêtes passent déjà par le
    // nouveau SW — source d'incohérences. On force donc un seul rechargement
    // dès que le SW qui contrôle la page change.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Vérifie immédiatement s'il existe une version plus récente que celle
      // potentiellement mise en cache par le navigateur (bien que sw.js soit
      // servi en no-cache côté serveur, on force la vérification ici aussi).
      registration.update().catch(() => {});

      // Revérifie à chaque fois que l'onglet redevient visible : couvre le
      // cas d'un onglet/app PWA resté ouvert en arrière-plan pendant qu'un
      // nouveau déploiement a eu lieu.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
    }).catch(() => {});
  }, []);
  return null;
}
