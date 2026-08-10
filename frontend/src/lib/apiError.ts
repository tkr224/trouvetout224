/**
 * Classification des erreurs d'appel API pour l'affichage utilisateur.
 *
 * On ne montre JAMAIS le message technique brut (code HTTP, stack, "Network Error")
 * à l'utilisateur : on range l'erreur dans une des trois familles ci-dessous, et
 * `ErrorState` affiche un texte rassurant adapté à chacune.
 */
export type ErrorKind = 'network' | 'server' | 'notFound' | 'unknown';

/** Range une erreur axios (ou autre) dans une famille compréhensible. */
export function getErrorKind(error: unknown): ErrorKind {
  if (!error) return 'unknown';
  const e = error as any;

  // Timeout de l'instance axios (20 s) ou requête annulée → traité comme réseau :
  // dans les deux cas l'utilisateur doit surtout réessayer.
  if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT' || e.code === 'ERR_NETWORK') return 'network';

  // Pas de réponse du tout = le serveur n'a jamais été joint (hors ligne, DNS, CORS…)
  if (e.isAxiosError && !e.response) return 'network';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'network';

  const status = e.response?.status;
  if (status === 404) return 'notFound';
  if (typeof status === 'number' && status >= 500) return 'server';
  if (typeof status === 'number' && status >= 400) return 'server';

  if (!e.response && e.message === 'Network Error') return 'network';
  return 'unknown';
}
