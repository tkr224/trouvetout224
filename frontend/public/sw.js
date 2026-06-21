// Service Worker MINIMAL — rend la PWA installable sur Android/Chrome.
// AUCUNE mise en cache : toutes les requêtes passent par le réseau normalement.
// Cela garantit que la connexion, l'API backend et l'authentification
// fonctionnent exactement comme sans service worker.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Supprimer tout ancien cache qui aurait pu exister
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

// Le gestionnaire fetch est requis par Chrome pour activer l'installation PWA.
// On n'intercepte rien : tout passe directement au réseau.
self.addEventListener('fetch', () => {});
