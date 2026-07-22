import { getTranslations, getLocale } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  Lock, Database, Target, ShieldCheck, Share2, Cookie, UserCheck,
  MessageCircle, Mail, ImageIcon, Send, Chrome,
} from 'lucide-react';

const SECTION_DEFS = [
  { key: 'collect', icon: Database },
  { key: 'why', icon: Target },
  { key: 'protection', icon: ShieldCheck },
  { key: 'sharing', icon: Share2 },
  { key: 'cookies', icon: Cookie },
  { key: 'rights', icon: UserCheck },
] as const;

const PARTNER_DEFS = [
  { key: 'cloudinary', icon: ImageIcon, name: 'Cloudinary' },
  { key: 'resend',     icon: Send,      name: 'Resend' },
  { key: 'google',     icon: Chrome,    name: 'Google' },
] as const;

const LOCALE_TAGS: Record<string, string> = { fr: 'fr-FR', en: 'en-US', zh: 'zh-CN' };

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function ConfidentialitePage() {
  const t = await getTranslations('confidentialite');
  const locale = await getLocale();
  const updatedAt = capitalize(
    new Date().toLocaleDateString(LOCALE_TAGS[locale] || 'fr-FR', { month: 'long', year: 'numeric' })
  );

  const SECTIONS = SECTION_DEFS.map((def) => ({
    icon: def.icon,
    title: t(`sections.${def.key}.title`),
    items: t.raw(`sections.${def.key}.items`) as string[],
    partners: def.key === 'sharing'
      ? PARTNER_DEFS.map((p) => ({ icon: p.icon, name: p.name, role: t(`sections.sharing.partners.${p.key}`) }))
      : undefined,
  }));

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-14 sm:py-16"
        style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 55%, rgb(var(--p-900)) 100%)' }}
      >
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '50%', height: '120%', top: '-15%', left: '-15%',
            background: 'radial-gradient(ellipse, rgb(var(--p-600) / 0.45) 0%, transparent 68%)',
            filter: 'blur(52px)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center" style={{ zIndex: 2 }}>
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-5">
            <Lock size={26} className="text-gold-300" />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-3" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
            {t('hero.title')}
          </h1>
          <p className="text-white/90 text-base sm:text-lg mb-2" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
            {t('hero.subtitle')}
          </p>
          <p className="text-white/60 text-xs">{t('hero.updatedAt', { date: updatedAt })}</p>
        </div>
      </section>

      {/* ══ SECTIONS ═══════════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-14 space-y-5">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="card p-6 sm:p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary-700" />
                </div>
                <h2 className="font-display font-bold text-dark-900 text-lg">{section.title}</h2>
              </div>
              <ul className="space-y-2.5 pl-1">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-dark-600 text-sm leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {section.partners && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  {section.partners.map(p => (
                    <div key={p.name} className="bg-dark-50 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <p.icon size={16} className="text-primary-700" />
                      </div>
                      <p className="font-semibold text-dark-900 text-sm">{p.name}</p>
                      <p className="text-dark-500 text-xs leading-snug">{p.role}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* ══ CONTACT ═══════════════════════════════════════════════════ */}
        <div className="card p-8 text-center bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-800 border border-primary-200 dark:border-primary-800/40">
          <MessageCircle size={26} className="text-primary-700 mx-auto mb-3" />
          <p className="text-dark-700 font-semibold text-lg mb-2">{t('contact.title')}</p>
          <p className="text-dark-500 text-sm mb-5">{t('contact.subtitle')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="https://wa.me/224627543486" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
              <MessageCircle size={16} /> {t('contact.whatsapp')}
            </a>
            <a href="mailto:contact.trouvetout224@gmail.com" className="btn-outline inline-flex items-center gap-2">
              <Mail size={16} /> contact.trouvetout224@gmail.com
            </a>
          </div>
          <p className="text-dark-400 text-xs mt-4">
            {t('contact.seeAlsoPrefix')} <Link href="/conditions" className="text-primary-700 font-semibold hover:underline">{t('contact.terms')}</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
