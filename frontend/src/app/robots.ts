import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/messages/',
          '/notifications/',
          '/parametres/',
        ],
      },
    ],
    sitemap: 'https://trouvetout224.site/sitemap.xml',
  };
}
