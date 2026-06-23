import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://trouvetout224.site';
  const now = new Date();

  return [
    { url: base,                            lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/annonces`,              lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/boutiques`,             lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/emplois`,               lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/categories`,            lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/restaurants`,           lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/hotels`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/premium`,               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/a-propos`,              lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`,               lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/aide`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/auth/connexion`,        lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/auth/inscription`,      lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/conditions`,            lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/confidentialite`,       lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];
}
