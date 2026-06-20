import type { Metadata } from 'next';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import dynamic from 'next/dynamic';

const SplashScreen = dynamic(() => import('@/components/SplashScreen'), { ssr: false });
const OnboardingGate = dynamic(() => import('@/components/OnboardingGate'), { ssr: false });

export const metadata: Metadata = {
  title: 'TrouveTout224 - La plus grande marketplace de Guinée',
  description: 'Achetez, vendez, trouvez tout ce dont vous avez besoin en Guinée.',
};

// Script inline exécuté AVANT le rendu pour éviter le flash de thème
const themeScript = `(function(){try{
  var t=localStorage.getItem('tt224-theme');
  var dark=window.matchMedia('(prefers-color-scheme:dark)').matches;
  if(t==='dark'||(t!=='light'&&dark)){document.documentElement.classList.add('dark')}
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Applique le thème sombre avant le premier rendu — évite le flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <SplashScreen />
            <OnboardingGate />
            {children}
            <Toaster position="top-center" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
