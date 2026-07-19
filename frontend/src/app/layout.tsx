import type { Metadata } from 'next';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import dynamic from 'next/dynamic';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const SplashScreen        = dynamic(() => import('@/components/SplashScreen'),                    { ssr: false });
const OnboardingGate      = dynamic(() => import('@/components/OnboardingGate'),                  { ssr: false });
const PWAInstallBanner    = dynamic(() => import('@/components/PWAInstallBanner'),                { ssr: false });
const EmailVerificationBanner = dynamic(() => import('@/components/EmailVerificationBanner'),      { ssr: false });
const PWARegister         = dynamic(() => import('@/components/PWARegister'),                     { ssr: false });
const ThemeAnimations     = dynamic(() => import('@/components/ThemeAnimations'),                 { ssr: false });
const Futur3DOrchestrator = dynamic(() => import('@/components/futur3d/Futur3DOrchestrator'),    { ssr: false });
const AiChatWidget        = dynamic(() => import('@/components/AiChatWidget'),                    { ssr: false });
const OnboardingNudge     = dynamic(() => import('@/components/onboarding/OnboardingNudge'),       { ssr: false });

/* ── Métadonnées globales (SEO + Open Graph + PWA) ───────────────── */
export const metadata: Metadata = {
  metadataBase: new URL('https://trouvetout224.site'),

  title: {
    default: 'TrouveTout224 — Petites annonces en Guinée | Achat et vente',
    template: '%s | TrouveTout224',
  },
  description:
    'TrouveTout224 est la plus grande marketplace de Guinée. Achetez, vendez et trouvez des petites annonces : immobilier, voitures, électronique, emplois, services à Conakry et partout en Guinée.',
  keywords: [
    'petites annonces', 'marketplace', 'Guinée', 'Conakry',
    'acheter', 'vendre', 'annonces', 'TrouveTout224',
    'occasion', 'emploi', 'immobilier', 'voiture', 'Afrique de l\'Ouest',
  ],
  authors:   [{ name: 'TrouveTout224', url: 'https://trouvetout224.site' }],
  creator:   'TrouveTout224',
  publisher: 'TrouveTout224',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  /* ── Vérification Google Search Console ── */
  verification: {
    google: '5XQYMJLG8eJYkZlEbeYE0gsqMNDRA87VUN93D3B3PZw',
  },

  /* ── Open Graph (Facebook, WhatsApp, LinkedIn…) ── */
  openGraph: {
    type:        'website',
    locale:      'fr_GN',
    url:         'https://trouvetout224.site',
    siteName:    'TrouveTout224',
    title:       'TrouveTout224 — Petites annonces en Guinée',
    description: 'La plus grande marketplace de Guinée. Achetez, vendez et trouvez tout ce dont vous avez besoin à Conakry et partout en Guinée.',
    images: [{
      url:    '/og-image.png',
      width:  1200,
      height: 630,
      alt:    'TrouveTout224 - Marketplace Guinée',
    }],
  },

  /* ── Twitter / X Card ── */
  twitter: {
    card:        'summary_large_image',
    title:       'TrouveTout224 — Petites annonces en Guinée',
    description: 'La plus grande marketplace de Guinée. Achetez, vendez et trouvez tout ce dont vous avez besoin.',
    images:      ['/og-image.png'],
  },

  /* ── PWA ── */
  manifest: '/manifest.json',
  appleWebApp: {
    capable:         true,
    title:           'TrouveTout224',
    statusBarStyle:  'default',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

/* ── Script anti-flash : restaure thème sombre + couleur avant le 1er paint ─ */
const themeScript = `(function(){try{
  var t=localStorage.getItem('tt224-theme');
  var dark=window.matchMedia('(prefers-color-scheme:dark)').matches;
  if(t==='dark'||(t!=='light'&&dark)){document.documentElement.classList.add('dark')}
  var s=localStorage.getItem('tt224-special');
  var c=localStorage.getItem('tt224-color');
  var validColors=['blue','purple','orange','red','teal','royal','feu','nuit','minimaliste','terre','animated','neon','valentine','halloween','luxe','retro','ocean','foret','galaxie','lave','pluie','arcenciel','glace','orliquide'];
  var validSpecial=['noel','ramadan','independence'];
  if(s&&validSpecial.includes(s)){document.documentElement.setAttribute('data-color',s)}
  else if(c&&validColors.includes(c)){document.documentElement.setAttribute('data-color',c)}
}catch(e){}})();`;

/* ── Données structurées JSON-LD (Google Search) ────────────────── */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id':   'https://trouvetout224.site/#website',
      url:     'https://trouvetout224.site',
      name:    'TrouveTout224',
      description: 'La plus grande marketplace de Guinée',
      inLanguage:  'fr',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type':     'EntryPoint',
          urlTemplate: 'https://trouvetout224.site/annonces?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id':   'https://trouvetout224.site/#organization',
      name:    'TrouveTout224',
      url:     'https://trouvetout224.site',
      logo: {
        '@type':  'ImageObject',
        url:      'https://trouvetout224.site/icons/icon-512.png',
        width:    512,
        height:   512,
      },
      contactPoint: {
        '@type':            'ContactPoint',
        contactType:        'customer service',
        email:              'contact.trouvetout224@gmail.com',
        availableLanguage:  'French',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Anti-flash thème sombre — doit s'exécuter avant le premier paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        {/* Couleur de la barre système (clair/sombre) */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#1B8B3B" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#111827" />

        {/* Données structurées pour Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <ThemeAnimations />
            <Futur3DOrchestrator />
            <SplashScreen />
            <OnboardingGate />
            <EmailVerificationBanner />
            {children}
            <Toaster position="top-center" />
            <PWAInstallBanner />
            <PWARegister />
            <AiChatWidget />
            <OnboardingNudge />
          </ThemeProvider>
        </QueryProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
