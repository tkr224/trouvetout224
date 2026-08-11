/**
 * Détection du contexte d'exécution natif (app Android Capacitor).
 *
 * On lit le global `window.Capacitor` que le pont natif injecte au démarrage
 * du document, plutôt que d'importer `@capacitor/core` : ça évite d'embarquer
 * le paquet dans le bundle servi aux navigateurs et supprime tout risque
 * d'exécution côté serveur (ces fonctions renvoient simplement `false`/`'web'`
 * pendant le rendu SSR).
 *
 * À n'appeler que depuis un `useEffect` ou un gestionnaire d'évènement : au
 * premier rendu client, React doit produire le même HTML que le serveur.
 */
type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  platform?: string;
};

const cap = (): CapacitorGlobal | undefined =>
  typeof window === 'undefined' ? undefined : (window as any).Capacitor;

/** `true` uniquement dans l'app Android/iOS, `false` en navigateur (PWA incluse). */
export const isNativeApp = (): boolean => {
  const c = cap();
  if (!c) return false;
  if (typeof c.isNativePlatform === 'function') return c.isNativePlatform();
  // Filet de sécurité si le pont expose seulement `platform`.
  return c.platform === 'android' || c.platform === 'ios';
};

/** Plateforme courante : 'android', 'ios' ou 'web'. */
export const nativePlatform = (): string => {
  const c = cap();
  if (!c) return 'web';
  if (typeof c.getPlatform === 'function') return c.getPlatform();
  return c.platform ?? 'web';
};
