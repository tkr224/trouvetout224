// Suivi LÉGER de l'activité des utilisateurs connectés, pour personnaliser le fil.
// Règles de confidentialité :
//  - uniquement des utilisateurs connectés (aucune trace pour les visiteurs anonymes),
//  - jamais d'IP, d'User-Agent, de contenu de message ni de données de contact,
//  - rien n'est enregistré si l'utilisateur a désactivé la personnalisation,
//  - historique visible et effaçable dans Paramètres > Personnalisation,
//  - purge automatique après 180 jours (voir ranking/jobs.ts).
// Toutes les fonctions sont "fire-and-forget" : elles ne lèvent jamais d'erreur et
// ne ralentissent jamais la requête qui les appelle.
import { prisma } from '../config/database';
import type { InteractionType } from '@prisma/client';

const ACTIVITY_THROTTLE_MS = 15 * 60 * 1000;
const lastTouch = new Map<string, number>();

// Paramètre "personnalisation activée" — mis en cache 5 min pour ne pas relire
// la base à chaque interaction.
const prefCache = new Map<string, { enabled: boolean; at: number }>();
const PREF_TTL_MS = 5 * 60 * 1000;

// Anti-doublon : la même interaction (même type + même cible) n'est comptée qu'une
// fois par fenêtre de 10 min (ex : rechargement de page, retour arrière).
const dedupe = new Map<string, number>();
const DEDUPE_MS = 10 * 60 * 1000;

// Utilisateurs dont le profil de goûts doit être reconstruit au prochain affichage.
export const dirtyProfiles = new Set<string>();

// Callback branché par ranking/jobs.ts (évite une dépendance circulaire) :
// appelé quand un vendeur revient après > 7 jours d'absence, pour que ses
// annonces remontent tout de suite au lieu d'attendre le prochain recalcul.
let onSellerReturn: ((userId: string) => void) | null = null;
export function setOnSellerReturn(cb: (userId: string) => void) { onSellerReturn = cb; }

function sweep(map: Map<string, number>, ttl: number) {
  if (map.size < 5000) return;
  const now = Date.now();
  for (const [k, t] of map) if (now - t > ttl) map.delete(k);
}

export function touchUserActivity(userId: string | undefined) {
  if (!userId) return;
  const now = Date.now();
  const last = lastTouch.get(userId);
  if (last && now - last < ACTIVITY_THROTTLE_MS) return;
  lastTouch.set(userId, now);
  sweep(lastTouch, ACTIVITY_THROTTLE_MS);
  (async () => {
    const before = await prisma.user.findUnique({ where: { id: userId }, select: { lastActiveAt: true } });
    if (!before) return;
    await prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } });
    const wasAwayMs = before.lastActiveAt ? now - before.lastActiveAt.getTime() : Infinity;
    if (wasAwayMs > 7 * 24 * 60 * 60 * 1000) onSellerReturn?.(userId);
  })().catch(e => console.error('[activity] touch:', e?.message));
}

export async function isPersonalizationEnabled(userId: string): Promise<boolean> {
  const c = prefCache.get(userId);
  if (c && Date.now() - c.at < PREF_TTL_MS) return c.enabled;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { personalizationEnabled: true } });
  const enabled = u?.personalizationEnabled ?? false;
  prefCache.set(userId, { enabled, at: Date.now() });
  return enabled;
}

export function setPersonalizationCache(userId: string, enabled: boolean) {
  prefCache.set(userId, { enabled, at: Date.now() });
}

export interface TrackInput {
  type: InteractionType;
  annonceId?: string | null;
  demandeId?: string | null;
  categoryId?: string | null;
  cityId?: string | null;
  hashtag?: string | null;
  query?: string | null;
  value?: number | null;
}

export function trackInteraction(userId: string | undefined, input: TrackInput) {
  if (!userId) return;
  const key = `${userId}:${input.type}:${input.annonceId || input.demandeId || ''}:${input.categoryId || ''}:${input.hashtag || ''}:${(input.query || '').toLowerCase()}`;
  // DWELL n'est pas dédoublonné (une durée par visite), le reste l'est.
  if (input.type !== 'DWELL') {
    const last = dedupe.get(key);
    if (last && Date.now() - last < DEDUPE_MS) return;
    dedupe.set(key, Date.now());
    sweep(dedupe, DEDUPE_MS);
  }
  (async () => {
    if (!(await isPersonalizationEnabled(userId))) return;
    await prisma.userInteraction.create({
      data: {
        userId,
        type: input.type,
        annonceId: input.annonceId || null,
        demandeId: input.demandeId || null,
        categoryId: input.categoryId || null,
        cityId: input.cityId || null,
        hashtag: input.hashtag ? String(input.hashtag).slice(0, 40) : null,
        query: input.query ? String(input.query).trim().slice(0, 100) : null,
        value: input.value != null ? Math.max(0, Math.min(3600, Math.round(input.value))) : null,
      },
    });
    dirtyProfiles.add(userId);
  })().catch(e => console.error('[activity] track:', e?.message));
}
