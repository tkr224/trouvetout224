'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Logo from '@/components/Logo';
import HeroRotatingText from '@/components/home/HeroRotatingText';
import { Sparkles, MessageCircle, ShieldCheck, Zap, Eye, ArrowRight } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   DIAPORAMA DU HÉRO — photos locales (public/images/hero/)
   ──────────────────────────────────────────────────────────────────────
   Pour ajouter vos photos :
     1. Déposez vos fichiers dans frontend/public/images/hero/
        (noms recommandés : hero-1.jpg, hero-2.jpg, hero-3.jpg…)
     2. Ajoutez une ligne ci-dessous par photo (1 à 6 images acceptées).
     3. Rien à ajouter ? Laissez le tableau vide (HERO_IMAGES = []) :
        un dégradé vert élégant s'affiche automatiquement à la place.
   Format recommandé : JPG, ≥ 1600×900 px (ratio paysage 16/9), poids
   optimisé (~150-300 Ko/photo max — connexions mobiles en Guinée).
   ─────────────────────────────────────────────────────────────────── */
const HERO_IMAGES: { url: string; alt: string }[] = [
  // { url: '/images/hero/hero-1.jpg', alt: 'Marché animé à Conakry' },
  // { url: '/images/hero/hero-2.jpg', alt: 'Commerçant souriant dans sa boutique' },
  // { url: '/images/hero/hero-3.jpg', alt: 'Jeune Guinéen utilisant son smartphone' },
];

/* Vitesse du diaporama — modifiez uniquement ces deux constantes.
   HERO_SLIDE_INTERVAL_MS : durée d'affichage de chaque photo.
   HERO_TRANSITION_MS     : durée du fondu enchaîné entre deux photos. */
const HERO_SLIDE_INTERVAL_MS = 5500;
const HERO_TRANSITION_MS     = 1400;

export default function HeroSection() {
  const t = useTranslations('accueil');
  const [heroSlide, setHeroSlide]       = useState(0);
  const [heroReady, setHeroReady]       = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  /* Préférence utilisateur "mouvement réduit" — désactive les animations décoratives */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
  }, []);

  /* Déclenche l'apparition en cascade du texte du hero, un instant après le montage */
  useEffect(() => {
    if (reduceMotion) { setHeroReady(true); return; }
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  /* Avancement automatique du diaporama hero (voir HERO_SLIDE_INTERVAL_MS) */
  useEffect(() => {
    if (HERO_IMAGES.length <= 1 || reduceMotion) return;
    const t = setInterval(() => setHeroSlide(i => (i + 1) % HERO_IMAGES.length), HERO_SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [reduceMotion]);

  /* Style d'apparition en cascade — désactivé si mouvement réduit (affichage statique immédiat) */
  const heroFadeIn = (delayMs: number): React.CSSProperties => reduceMotion
    ? {}
    : {
        opacity: heroReady ? 1 : 0,
        transform: heroReady ? 'none' : 'translateY(14px)',
        transition: `opacity 650ms ease ${delayMs}ms, transform 650ms ease ${delayMs}ms`,
      };

  return (
    <section
      id="hero"
      className="relative overflow-hidden min-h-[380px] sm:min-h-[420px] flex items-center py-10 sm:py-14"
      style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 55%, rgb(var(--p-900)) 100%)' }}
    >

      {/* Diaporama de photos en arrière-plan — fondu doux, voir HERO_IMAGES plus haut.
          Tableau vide ⇒ seul le dégradé vert de la section reste visible (fallback). */}
      {HERO_IMAGES.map((img, i) => (
        <div
          key={img.url}
          className="absolute inset-0 ease-in-out"
          style={{
            opacity: i === heroSlide ? 1 : 0,
            transitionProperty: 'opacity',
            transitionDuration: `${HERO_TRANSITION_MS}ms`,
            zIndex: 0,
          }}
          aria-hidden={i !== heroSlide}
        >
          <Image
            src={img.url}
            alt={img.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            quality={70}
            className="object-cover object-center"
          />
        </div>
      ))}

      {/* ─── Blobs animés — couleurs du thème actif ──────────────── */}
      <div
        className="hero-blob pointer-events-none absolute rounded-full"
        style={{
          width: '65%', height: '130%',
          top: '-15%', left: '-18%',
          background: 'radial-gradient(ellipse, rgb(var(--p-600) / 0.55) 0%, transparent 68%)',
          filter: 'blur(52px)',
          animation: 'hero-blob-drift-1 14s ease-in-out infinite',
          zIndex: 1,
        }}
      />
      <div
        className="hero-blob pointer-events-none absolute rounded-full"
        style={{
          width: '50%', height: '110%',
          top: '5%', right: '-12%',
          background: 'radial-gradient(ellipse, rgb(var(--p-700) / 0.45) 0%, transparent 65%)',
          filter: 'blur(56px)',
          animation: 'hero-blob-drift-2 18s ease-in-out infinite',
          zIndex: 1,
        }}
      />
      <div
        className="hero-blob pointer-events-none absolute rounded-full"
        style={{
          width: '38%', height: '80%',
          bottom: '-8%', left: '33%',
          background: 'radial-gradient(ellipse, rgba(245,197,24,0.20) 0%, transparent 65%)',
          filter: 'blur(42px)',
          animation: 'hero-blob-drift-3 11s ease-in-out infinite',
          zIndex: 1,
        }}
      />

      {/* Voile pour lisibilité du texte — plus opaque à gauche (où est le texte), plus léger à droite */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent hidden lg:block" />
      </div>

      {/* Motif de points discret */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px', zIndex: 3 }}
      />

      {/* Contenu */}
      <div className="relative w-full max-w-7xl mx-auto px-4" style={{ zIndex: 4 }}>
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

          {/* Texte */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge de marque */}
            <div className="flex items-center gap-2.5 justify-center lg:justify-start mb-4" style={heroFadeIn(0)}>
              <Logo size={34} />
              <span
                className="font-display font-extrabold text-lg leading-none"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,0.7)' }}
              >
                <span className="text-guinea-400">Trouve</span>
                <span className="text-gold-400">Tout</span>
                <span className="text-white">224</span>
              </span>
            </div>

            {/* Titre — la valeur, comprise en un coup d'œil */}
            <h1
              className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-white mb-4"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,0.7)', ...heroFadeIn(90) }}
            >
              {t('hero.titleLine1')}<br className="hidden sm:block" />{' '}
              <span className="bg-gradient-to-r from-white via-primary-200 to-gold-200 bg-clip-text text-transparent">
                {t('hero.titleLine2')}
              </span>
            </h1>

            {/* Sous-titre — répond à l'objection "est-ce fiable ?" */}
            <p
              className="text-white text-base sm:text-lg leading-relaxed mb-5 max-w-lg mx-auto lg:mx-0 font-medium"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)', ...heroFadeIn(180) }}
            >
              {t('hero.subtitle')}
            </p>

            {/* Texte dynamique — donne du mouvement au hero */}
            <div
              className="inline-flex items-center gap-2 bg-black/25 border border-white/20 rounded-full px-3.5 py-1.5 mb-5 backdrop-blur-md"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)', ...heroFadeIn(270) }}
            >
              <Sparkles size={13} className="text-gold-300 shrink-0" />
              <span className="text-white text-xs sm:text-sm font-semibold">
                <HeroRotatingText />
              </span>
            </div>

            {/* Indicateurs de confiance — bénéfices concrets, pas des fonctionnalités */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6" style={heroFadeIn(360)}>
              {[
                { icon: MessageCircle, text: t('hero.badge1') },
                { icon: ShieldCheck,   text: t('hero.badge2') },
                { icon: Zap,           text: t('hero.badge3') },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5 bg-black/30 border border-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md">
                  <Icon size={12} className="text-gold-300 shrink-0" />
                  {text}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start" style={heroFadeIn(450)}>
              <Link
                href="/annonces/publier"
                className="hero-cta-glow-gold inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 active:scale-95 text-dark-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                <Zap size={16} /> {t('hero.ctaPublish')}
              </Link>
              <Link
                href="/annonces/lister"
                className="hero-cta-glow-outline inline-flex items-center gap-2 border-2 border-white/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/15 active:scale-95 transition-all backdrop-blur-sm"
              >
                <Eye size={14} /> {t('hero.ctaBrowse')} <ArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Points de navigation du diaporama — affichés seulement s'il y a plusieurs photos */}
      {HERO_IMAGES.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2" style={{ zIndex: 5, ...heroFadeIn(500) }}>
          {HERO_IMAGES.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setHeroSlide(i)}
              aria-label={t('hero.imageAlt', { number: i + 1 })}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === heroSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
