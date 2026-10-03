'use client';
// Barre de navigation mobile fixe (< 1024px) — maquette 2026-10 :
// 76px + safe-area, 5 éléments, bouton central « Publier » rond, or, surélevé.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';

// Pages où la barre gênerait (saisie en bas d'écran, back-office, connexion)
const HIDDEN_PREFIXES = ['/admin', '/auth', '/confirmer-email', '/verifier-email'];
const isConversation = (p: string) => /^\/messages\/[^/]+/.test(p);

export default function BottomNav() {
  const pathname = usePathname() || '/';
  const t = useTranslations('nav');
  const hidden = HIDDEN_PREFIXES.some(p => pathname.startsWith(p)) || isConversation(pathname);

  // Réserve la place de la barre en bas de page (voir .has-bottom-nav dans globals.css)
  useEffect(() => {
    document.body.classList.toggle('has-bottom-nav', !hidden);
    return () => document.body.classList.remove('has-bottom-nav');
  }, [hidden]);

  if (hidden) return null;

  const items = [
    { href: '/', label: t('bottom.home'), icon: Home, active: pathname === '/' },
    { href: '/je-cherche', label: t('links.jeCherche'), icon: Search, active: pathname.startsWith('/je-cherche') },
    null,
    { href: '/messages', label: t('messages'), icon: MessageCircle, active: pathname.startsWith('/messages') },
    { href: '/profil', label: t('bottom.profile'), icon: User, active: pathname.startsWith('/profil') || pathname.startsWith('/parametres') },
  ];

  return (
    <nav
      aria-label={t('bottom.label')}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-tt-bottombar border-t border-tt-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="h-[76px] grid grid-cols-5 items-stretch">
        {items.map((it, i) => it === null ? (
          <li key="publish" className="relative flex justify-center">
            <Link
              href="/annonces/publier"
              aria-label={t('publish')}
              className="absolute -top-[22px] w-14 h-14 rounded-full bg-tt-gold text-tt-on-gold flex items-center justify-center border-4 border-tt-bg shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={24} strokeWidth={2.25} />
            </Link>
            <span className="self-end mb-3 text-[11px] font-medium text-tt-muted">{t('publish')}</span>
          </li>
        ) : (
          <li key={it.href}>
            <Link
              href={it.href}
              aria-current={it.active ? 'page' : undefined}
              className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-1 ${it.active ? 'text-tt-green-icon' : 'text-tt-muted'}`}
            >
              <it.icon size={22} strokeWidth={1.75} />
              <span className="text-[11px] font-medium leading-none">{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
