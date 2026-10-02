// Profil de goûts d'un utilisateur : reconstruit à partir de ses interactions
// (UserInteraction) et mis en cache en base (UserTasteProfile) + en mémoire.
// Une reconstruction coûte 2 requêtes ; elle n'a lieu que si de nouvelles
// interactions sont arrivées, et au plus toutes les 2 minutes par utilisateur.
import { prisma } from '../../config/database';
import { dirtyProfiles, isPersonalizationEnabled } from '../activity';
import { buildTasteProfile, type TasteProfile, type AnnonceMeta, type InteractionLite } from './scoring';

const MEM_TTL_MS = 10 * 60 * 1000;
const MIN_REBUILD_INTERVAL_MS = 2 * 60 * 1000;
const MAX_ROW_AGE_MS = 6 * 60 * 60 * 1000; // la décroissance temporelle doit être rafraîchie de temps en temps
const memCache = new Map<string, { profile: TasteProfile; at: number }>();

function rowToProfile(row: any): TasteProfile {
  return {
    categories: (row.categories as Record<string, number>) || {},
    hashtags: (row.hashtags as Record<string, number>) || {},
    cities: (row.cities as Record<string, number>) || {},
    keywords: (row.keywords as Record<string, number>) || {},
    priceMedian: row.priceMedian ?? null,
    recentAnnonceIds: row.recentAnnonceIds || [],
    topCategoryIds: row.topCategoryIds || [],
    interactionCount: row.interactionCount || 0,
  };
}
export { rowToProfile };

export function invalidateTasteProfile(userId: string) {
  memCache.delete(userId);
}

export async function rebuildTasteProfile(userId: string): Promise<TasteProfile> {
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const rows = await prisma.userInteraction.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 400,
  });
  const annonceIds = Array.from(new Set(rows.map(r => r.annonceId).filter(Boolean))) as string[];
  const annonces = annonceIds.length
    ? await prisma.annonce.findMany({
        where: { id: { in: annonceIds } },
        select: { id: true, categoryId: true, cityId: true, hashtags: true, price: true, category: { select: { parentId: true } } },
      })
    : [];
  const meta = new Map<string, AnnonceMeta>(annonces.map(a => [a.id, {
    id: a.id, categoryId: a.categoryId, parentCategoryId: a.category?.parentId, cityId: a.cityId, hashtags: a.hashtags, price: a.price,
  }]));
  const profile = buildTasteProfile(rows as unknown as InteractionLite[], meta, new Date());
  const data = {
    categories: profile.categories, hashtags: profile.hashtags, cities: profile.cities, keywords: profile.keywords,
    priceMedian: profile.priceMedian, recentAnnonceIds: profile.recentAnnonceIds, topCategoryIds: profile.topCategoryIds,
    interactionCount: profile.interactionCount, builtAt: new Date(),
  };
  await prisma.userTasteProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  dirtyProfiles.delete(userId);
  memCache.set(userId, { profile, at: Date.now() });
  return profile;
}

// Renvoie null si l'utilisateur a désactivé la personnalisation.
export async function getTasteProfile(userId: string): Promise<TasteProfile | null> {
  if (!(await isPersonalizationEnabled(userId))) return null;
  const dirty = dirtyProfiles.has(userId);
  const mem = memCache.get(userId);
  if (mem && !dirty && Date.now() - mem.at < MEM_TTL_MS) return mem.profile;

  const row = await prisma.userTasteProfile.findUnique({ where: { userId } });
  if (row) {
    const age = Date.now() - row.builtAt.getTime();
    if ((!dirty && age < MAX_ROW_AGE_MS) || age < MIN_REBUILD_INTERVAL_MS) {
      const profile = rowToProfile(row);
      memCache.set(userId, { profile, at: Date.now() });
      return profile;
    }
  }
  return rebuildTasteProfile(userId);
}
