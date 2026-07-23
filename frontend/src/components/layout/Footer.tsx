'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MapPin, Heart, Globe, Camera, AtSign, PlayCircle } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  const CATEGORIES = [
    { key: 'electronique', slug: 'electronique' },
    { key: 'vehicules',    slug: 'vehicules' },
    { key: 'immobilier',   slug: 'immobilier' },
    { key: 'emplois',      slug: 'emplois' },
    { key: 'restaurants',  slug: 'restaurants' },
    { key: 'hotels',       slug: 'hotels' },
    { key: 'mode',         slug: 'mode' },
    { key: 'services',     slug: 'services' },
  ] as const;
  const INFO_LINKS = [
    { key: 'about',      href: '/a-propos' },
    { key: 'howItWorks', href: '/aide' },
    { key: 'faq',        href: '/faq' },
    { key: 'publish',    href: '/annonces/publier' },
    { key: 'premium',    href: '/premium' },
    { key: 'contact',    href: '/contact' },
    { key: 'terms',      href: '/conditions' },
    { key: 'privacy',    href: '/confidentialite' },
    { key: 'credits',    href: '/credits-images' },
  ] as const;
  return (
    <footer className="site-footer bg-dark-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo & description */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex shadow-sm relative">
                <div className="flex-1 bg-guinea-500" />
                <div className="flex-1 bg-gold-500" />
                <div className="flex-1 bg-primary-700" />
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow">TT</span>
              </div>
              <span className="font-display font-bold text-xl leading-none">
                <span className="text-guinea-500">Trouve</span>
                <span className="text-gold-400">Tout</span>
                <span className="text-primary-500">224</span>
              </span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed">
              {t('description')}
            </p>
            <div className="flex gap-3 mt-4">
              {[
                { Icon: Globe,       label: t('socials.website'),  href: '/' },
                { Icon: Camera,      label: t('socials.instagram'), href: 'https://www.instagram.com' },
                { Icon: AtSign,      label: t('socials.twitter'), href: 'https://twitter.com' },
                { Icon: PlayCircle,  label: t('socials.youtube'),   href: 'https://www.youtube.com' },
              ].map(({ Icon, label, href }) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer" aria-label={label}
                  className="w-9 h-9 bg-dark-700 rounded-xl flex items-center justify-center hover:bg-primary-700 transition-colors">
                  <Icon size={15} className="text-dark-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Catégories */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('categoriesTitle')}</h3>
            <ul className="space-y-2 text-dark-400 text-sm">
              {CATEGORIES.map(({ key, slug }) => (
                <li key={slug}>
                  <Link href={`/categories/${slug}`} className="hover:text-primary-400 transition-colors">
                    {t(`categories.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Villes */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('citiesTitle')}</h3>
            <ul className="space-y-2 text-dark-400 text-sm">
              {['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'].map((v) => (
                <li key={v}>
                  <Link href={`/annonces/lister?city=${v}`} className="hover:text-primary-400 transition-colors flex items-center gap-1.5">
                    <MapPin size={11} className="text-primary-500 shrink-0" /> {v}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Infos */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('infoTitle')}</h3>
            <ul className="space-y-2 text-dark-400 text-sm">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary-400 transition-colors">
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-dark-500 text-sm">
          <p>{t('copyright', { year })}</p>
          <p className="flex items-center gap-1">{t('madeWith')} <Heart size={13} className="text-guinea-500 fill-guinea-500" /> {t('madeFor')}</p>
        </div>
      </div>
    </footer>
  );
}