import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuration Capacitor — application Android TrouveTout224.
 *
 * ── Pourquoi `server.url` et PAS un export statique ? ────────────────────
 * `next build && next export` (output: 'export') est incompatible avec ce
 * projet : il refuse les `headers()` (nos en-têtes de sécurité + CSP), les
 * routes API (`/api/hero-images` lit le disque à l'exécution), les pages en
 * `export const dynamic = 'force-dynamic'` (accueil, liste d'annonces…) et
 * le rendu serveur de next-intl qui lit le cookie NEXT_LOCALE.
 * Un export statique demanderait donc de réécrire une grande partie du site.
 *
 * En pointant la WebView sur le site déjà en ligne :
 *   - une seule base de code à maintenir ;
 *   - les mises à jour du site sont immédiates dans l'app, sans repasser par
 *     la validation Play Store (sauf changement de code natif) ;
 *   - l'auth, les cookies, les WebSockets et les appels API fonctionnent
 *     exactement comme dans le navigateur, même origine, sans CORS en plus.
 *
 * Contrepartie : l'app exige une connexion internet (aucun mode hors ligne),
 * ce qui correspond de toute façon au PWA actuel (service worker sans cache).
 */
const config: CapacitorConfig = {
  appId: 'site.trouvetout224.app',
  appName: 'TrouveTout224',

  // Dossier de repli embarqué dans l'APK. Avec `server.url`, son contenu ne
  // s'affiche que si l'URL distante est injoignable au démarrage.
  webDir: 'capacitor-www',

  server: {
    url: 'https://trouvetout224.site',
    // Le site est servi en HTTPS : on interdit tout contenu en clair.
    cleartext: false,
    androidScheme: 'https',
    // Domaines que la WebView a le droit d'ouvrir en interne. Tout le reste
    // (Google, WhatsApp, liens sortants d'annonces) part dans le navigateur
    // ou l'app dédiée du téléphone — indispensable pour OAuth, voir plus bas.
    allowNavigation: [
      'trouvetout224.site',
      '*.trouvetout224.site',
    ],
  },

  android: {
    // La WebView n'affiche pas la superposition bleutée au bout du scroll.
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Suffixe ajouté au User-Agent : permet au backend de reconnaître les
    // requêtes venant de l'app native (statistiques, futur push ciblé).
    appendUserAgent: 'TrouveTout224App',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      // Vert primaire de la marque (identique à theme_color du manifest PWA).
      backgroundColor: '#1B8B3B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    SocialLogin: {
      // La configuration Google réelle se fait à l'exécution (initialize),
      // avec le Client ID Web ET le Client ID Android — voir
      // src/lib/nativeGoogleAuth.ts.
    },
  },
};

export default config;
