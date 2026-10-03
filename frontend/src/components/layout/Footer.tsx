'use client';
// Pied de page (maquette 2026-10) : logo + accroche | Découvrir | Aide | Légal,
// puis ligne de bas de page « © TrouveTout224 » / « Fait en Guinée ».
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LogoWordmark } from '@/components/Logo';

export default function Footer() {
  const t = useTranslations('footer.v2');
  const cols = [
    { title: t('discover'), links: [
      { href: '/annonces/lister', label: t('annonces') },
      { href: '/je-cherche', label: t('jeCherche') },
      { href: '/boutiques', label: t('boutiques') },
    ] },
    { title: t('help'), links: [
      { href: '/aide', label: t('safety') },
      { href: '/contact', label: t('contact') },
      { href: '/faq', label: t('faq') },
    ] },
    { title: t('legal'), links: [
      { href: '/conditions', label: t('terms') },
      { href: '/confidentialite', label: t('privacy') },
    ] },
  ];

  return (
    <footer className="border-t border-tt-border bg-tt-footer">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="TrouveTout224 — accueil"><LogoWordmark /></Link>
            <p className="text-sm text-tt-muted mt-3 max-w-[280px]">{t('tagline')}</p>
          </div>
          {cols.map(c => (
            <div key={c.title}>
              <p className="font-semibold text-tt-text mb-3">{c.title}</p>
              <ul className="space-y-2">
                {c.links.map(l => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-tt-muted hover:text-tt-text transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-tt-border flex items-center justify-between gap-4 text-[13px] text-tt-faint">
          <span>© {new Date().getFullYear()} TrouveTout224</span>
          <span>{t('madeIn')}</span>
        </div>
      </div>
    </footer>
  );
}
