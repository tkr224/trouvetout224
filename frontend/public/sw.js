// Service Worker — installable PWA + mode hors-ligne partiel.
// Stratégie volontairement restreinte : on ne met en cache QUE les réponses
// GET des annonces (liste + détail) et leurs images. Tout le reste (auth,
// mutations POST/PUT/DELETE, pages, autres appels API) passe directement au
// réseau sans interception, exactement comme avant — pour ne jamais risquer
// de servir un token périmé ou une réponse mutée depuis le cache.

const CACHE_VERSION = 'tt224-v4';
const ANNONCES_CACHE = `${CACHE_VERSION}-annonces`;
const IMAGES_CACHE = `${CACHE_VERSION}-images`;
const MAX_ANNONCES_ENTRIES = 60;
const MAX_IMAGES_ENTRIES = 120;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== ANNONCES_CACHE && k !== IMAGES_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
  );
});

// Évite qu'un cache grossisse indéfiniment : supprime les entrées les plus
// anciennes (insérées en premier) au-delà de la limite.
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map(k => cache.delete(k)));
  }
}

function isAnnonceApiRequest(url) {
  return /\/api\/annonces(\/|$)/.test(url.pathname);
}

function isAnnonceImageRequest(url) {
  return url.hostname === 'res.cloudinary.com';
}

// Réseau d'abord, cache en secours (hors-ligne) : garde les données à jour
// quand la connexion fonctionne, tout en restant consultable sans réseau.
async function networkFirst(request, cacheName, maxEntries) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      trimCache(cacheName, maxEntries);
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

// Cache d'abord pour les images (contenu immuable par URL) : évite de
// retélécharger, et reste disponible hors-ligne dès la première vue.
//
// Les <img> vers Cloudinary n'ont pas d'attribut crossOrigin (et ne doivent pas
// en avoir — voir plus bas) : le navigateur les requête en mode no-cors, donc la
// réponse interceptée ici est OPAQUE (response.status vaut toujours 0, response.ok
// vaut donc toujours false, même quand le fetch a réellement réussi). Se fier à
// response.ok revient à ne JAMAIS mettre les images en cache — on se fie plutôt à
// l'absence d'exception de fetch(), et on traite explicitement le cas opaque comme
// un succès à mettre en cache.
async function cacheFirst(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    trimCache(cacheName, maxEntries);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (isAnnonceApiRequest(url)) {
    event.respondWith(networkFirst(request, ANNONCES_CACHE, MAX_ANNONCES_ENTRIES));
    return;
  }

  if (isAnnonceImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE, MAX_IMAGES_ENTRIES));
    return;
  }

  // Tout le reste : aucune interception, comportement réseau normal.
});
