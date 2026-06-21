'use client';
import { useEffect, useState } from 'react';
import { X, Download, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Ne pas afficher si déjà installé ou déjà fermé dans cette session
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      sessionStorage.getItem('pwa-banner-closed')
    ) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);

    if (ios && isSafari) {
      setIsIOS(true);
      // Délai de 4 s pour ne pas interrompre le chargement de la page
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }

    // Android / Chrome : événement natif d'installation
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setPrompt(null);
  };

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('pwa-banner-closed', '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="w-11 h-11 rounded-xl flex-shrink-0 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              Installer TrouveTout224
            </p>
            {isIOS ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                Touchez <Share2 className="inline w-3 h-3 mx-0.5 align-middle" /> puis{' '}
                <span className="font-semibold">«&nbsp;Sur l'écran d'accueil&nbsp;»</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Accès rapide, plein écran, sans navigateur
              </p>
            )}
          </div>

          {!isIOS && (
            <button
              onClick={handleInstall}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Installer
            </button>
          )}

          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
