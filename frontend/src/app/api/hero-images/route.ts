import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

/* Route mise en cache 24h (Full Route Cache) : on ne réappelle pas Unsplash
   à chaque visite, seulement quand le cache expire. */
export const revalidate = 86400;

const UNSPLASH_QUERIES = [
  'african market',
  'african shop',
  'west africa street',
  'market stall products',
  'african merchant',
  'conakry',
];
const PER_QUERY = 2; // 6 recherches x 2 photos ≈ une douzaine d'images

interface HeroImage {
  url: string;
  alt: string;
  credit?: { name: string; profileUrl: string };
}

/* Priorité aux photos locales : si l'utilisateur dépose ses propres fichiers
   dans public/images/hero/ (hero-1.jpg, hero-2.jpg…), on les utilise et on
   ignore complètement Unsplash. */
async function getLocalImages(): Promise<HeroImage[]> {
  try {
    const dir = path.join(process.cwd(), 'public', 'images', 'hero');
    const files = await readdir(dir);
    const photos = files
      .filter(f => /^hero-\d+\.(jpe?g|png|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return photos.map((f, i) => ({ url: `/images/hero/${f}`, alt: `TrouveTout224 — photo ${i + 1}` }));
  } catch {
    return [];
  }
}

async function getUnsplashImages(): Promise<HeroImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];

  const settled = await Promise.allSettled(
    UNSPLASH_QUERIES.map(async (query): Promise<HeroImage[]> => {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${PER_QUERY}&orientation=landscape&content_filter=high`;
      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
        next: { revalidate: 86400 },
      });
      if (!res.ok) throw new Error(`Unsplash ${res.status}`);
      const data = await res.json();
      const results: any[] = Array.isArray(data?.results) ? data.results : [];
      return results.map((p): HeroImage => ({
        url: `${p.urls.raw}&w=1920&h=1080&fit=crop&q=75&auto=format`,
        alt: p.alt_description || query,
        credit: p.user
          ? { name: p.user.name, profileUrl: `${p.user.links.html}?utm_source=trouvetout224&utm_medium=referral` }
          : undefined,
      }));
    })
  );

  return settled
    .filter((r): r is PromiseFulfilledResult<HeroImage[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

export async function GET() {
  const local = await getLocalImages();
  if (local.length > 0) {
    return NextResponse.json({ images: local }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  }

  try {
    const images = await getUnsplashImages();
    return NextResponse.json(
      { images },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' } }
    );
  } catch {
    // Clé absente, quota dépassé, panne réseau… → tableau vide, le hero affiche son dégradé de secours.
    return NextResponse.json({ images: [] });
  }
}
