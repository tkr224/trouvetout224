'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff, Wifi } from 'lucide-react';

// Bandeau discret informant l'utilisateur qu'il consulte des annonces
// mises en cache (voir public/sw.js) faute de connexion active.
export default function OfflineBanner() {
  const t = useTranslations('common');
  const [offline, setOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    const handleOffline = () => { setOffline(true); setJustReconnected(false); };
    const handleOnline = () => {
      setOffline(false);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!offline && !justReconnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center px-3 pt-2 pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-card backdrop-blur ${
          offline
            ? 'bg-dark-900/90 text-white'
            : 'bg-guinea-600/95 text-white'
        }`}
      >
        {offline ? <WifiOff size={13} /> : <Wifi size={13} />}
        {offline ? t('offlineBanner') : t('backOnline')}
      </div>
    </div>
  );
}
