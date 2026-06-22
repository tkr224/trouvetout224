'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Download, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Clés localStorage
const KEY_INSTALLED  = 'pwa_installed';   // '1' si installée
const KEY_DISMISSED  = 'pwa_dismissed_at'; // timestamp du dernier refus/fermeture

// Délai avant d'afficher le banner (ms) — l'utilisateur navigue d'abord
const SHOW_DELAY_MS  = 8000;
// Durée minimale entre deux affichages après un refus (30 jours)
const SNOOZE_MS      = 30 * 24 * 60 * 60 * 1000;

function shouldSuppressBanner(): boolean {
  // App déjà en mode standalone (lancée depuis l'écran d'accueil)
  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  ) {
    localStorage.setItem(KEY_INSTALLED, '1');
    return true;
  }
  // Marquée comme installée lors d'une session précédente
  if (localStorage.getItem(KEY_INSTALLED) === '1') return true;
  // Refusée / fermée il y a moins de SNOOZE_MS
  const ts = localStorage.getItem(KEY_DISMISSED);
  if (ts && Date.now() - parseInt(ts, 10) < SNOOZE_MS) return true;
  return false;
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt]   = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (shouldSuppressBanner()) return;

    // Écoute l'installation via l'UI du navigateur (hors de notre bouton)
    const onAppInstalled = () => {
      localStorage.setItem(KEY_INSTALLED, '1');
      setVisible(false);
    };
    window.addEventListener('appinstalled', onAppInstalled);

    const ua = navigator.userAgent;
    const ios    = /iphone|ipad|ipod/i.test(ua);
    const safari = /safari/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);

    if (ios && safari) {
      // iOS/Safari : pas d'événement natif, on affiche notre guide après le délai
      setIsIOS(true);
      timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    } else {
      // Android/Chrome : attendre l'événement beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault();
        setPrompt(e as BeforeInstallPromptEvent);
        timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', onAppInstalled);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    return () => {
      window.removeEventListener('appinstalled', onAppInstalled);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(KEY_INSTALLED, '1');
    } else {
      // L'utilisateur a refusé le dialogue natif → snooze 30 jours
      localStorage.setItem(KEY_DISMISSED, String(Date.now()));
    }
    setVisible(false);
    setPrompt(null);
  };

  const handleClose = () => {
    setVisible(false);
    // Fermeture du banner → snooze 30 jours
    localStorage.setItem(KEY_DISMISSED, String(Date.now()));
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
