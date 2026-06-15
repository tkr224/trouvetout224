import type { Metadata } from 'next';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/QueryProvider';
import dynamic from 'next/dynamic';

const SplashScreen = dynamic(() => import('@/components/SplashScreen'), { ssr: false });

export const metadata: Metadata = {
  title: 'TrouveTout224 - La plus grande marketplace de Guinée',
  description: 'Achetez, vendez, trouvez tout ce dont vous avez besoin en Guinée.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <QueryProvider>
          <SplashScreen />
          {children}
          <Toaster position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}