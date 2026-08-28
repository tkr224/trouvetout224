'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Radio } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type Announcement = {
  id: string;
  title: string;
  message: string;
  buttonText: string | null;
  buttonLink: string | null;
};

// Pop-up de diffusion admin -> tous les utilisateurs connectés (voir /admin/annonces-systeme).
// Ne s'affiche qu'une fois par annonce et par utilisateur : le backend ne renvoie plus
// une annonce une fois qu'une vue (SystemAnnouncementView) existe pour ce compte.
export default function SystemAnnouncementModal() {
  const t = useTranslations('common');
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) return;
    api.get('/system-announcements/active')
      .then(r => { if (r.data.data) setAnnouncement(r.data.data); })
      .catch(() => {});
  }, [_hasHydrated, isAuthenticated]);

  if (!announcement) return null;

  const markSeen = () => {
    api.post(`/system-announcements/${announcement.id}/seen`).catch(() => {});
  };

  const close = () => {
    markSeen();
    setAnnouncement(null);
  };

  // Convention spéciale : un lien de bouton "#chat" ouvre directement la fenêtre de
  // discussion d'Ibkek (même événement que "Continuer par écrit" depuis l'appel
  // vocal, voir VoiceCallScreen.tsx) au lieu de naviguer vers une page.
  const opensChat = announcement.buttonLink === '#chat';

  const handleAction = () => {
    markSeen();
    setAnnouncement(null);
    if (opensChat) {
      window.dispatchEvent(new CustomEvent('tt224:open-chat'));
    }
  };

  const isExternal = !opensChat && announcement.buttonLink?.startsWith('http');

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="glass-card w-full max-w-sm sm:max-w-md !bg-dark-900/90 border-white/10 text-white p-6 sm:p-7 relative overflow-hidden animate-fadeIn"
      >
        {/* Halo décoratif — cohérent avec le thème "verre liquide" du site */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--p-500)), transparent)' }}
        />

        <button
          onClick={close}
          aria-label={t('close')}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="relative z-[1]">
          <div className="w-12 h-12 rounded-2xl bg-primary-600/25 border border-primary-400/30 flex items-center justify-center mb-4">
            <Radio size={22} className="text-primary-300" />
          </div>

          <h2 className="text-xl font-display font-bold mb-2 pr-8">{announcement.title}</h2>
          <p className="text-sm text-dark-200 leading-relaxed whitespace-pre-wrap mb-6">{announcement.message}</p>

          <div className="flex items-center gap-3">
            {announcement.buttonText && announcement.buttonLink && (
              opensChat ? (
                <button
                  onClick={handleAction}
                  className="flex-1 text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {announcement.buttonText}
                </button>
              ) : (
                <a
                  href={announcement.buttonLink}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  onClick={handleAction}
                  className="flex-1 text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {announcement.buttonText}
                </a>
              )
            )}
            <button
              onClick={close}
              className={announcement.buttonText && announcement.buttonLink
                ? 'px-4 py-2.5 rounded-xl text-dark-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors'
                : 'flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors'}
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
