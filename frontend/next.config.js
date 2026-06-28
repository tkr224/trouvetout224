/** @type {import('next').NextConfig} */

// ── En-têtes de sécurité HTTP ──────────────────────────────────────────
const securityHeaders = [
  // Anti-clickjacking : interdit d'embarquer le site dans une iframe externe
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Empêche le navigateur de deviner le type MIME (MIME-sniffing attacks)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Force HTTPS pendant 2 ans (HSTS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Contrôle les infos envoyées dans le Referer
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Désactive les fonctionnalités navigateur inutilisées
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  // Désactive le prefetch DNS non sollicité
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Content Security Policy — ajustée pour Next.js + Cloudinary + Google Fonts + Three.js
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js injecte des scripts inline pour l'hydratation ; Three.js nécessite unsafe-eval pour les shaders WebGL
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind + Google Fonts utilisent des styles inline
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Polices Google Fonts
      "font-src 'self' data: https://fonts.gstatic.com",
      // Images : Cloudinary (annonces), Google (avatars OAuth), Unsplash (placeholders), blobs (canvas Three.js)
      "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com",
      // API backend + WebSocket (prod + dev)
      "connect-src 'self' https://api.trouvetout224.site wss://api.trouvetout224.site http://localhost:5000 ws://localhost:5000",
      // Workers Three.js peuvent utiliser des blobs
      "worker-src blob: 'self'",
      "media-src 'self' blob:",
      // Aucune frame externe autorisée
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  // ── En-têtes de sécurité sur toutes les routes ──────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    // Formats modernes uniquement (pas de SVG arbitraire depuis des domaines externes)
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;