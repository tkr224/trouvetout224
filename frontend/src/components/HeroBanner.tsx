'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, MapPin, ArrowRight, Tag, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

/* Quatre images de fond en rotation — déjà connues du navigateur (same-origin Unsplash cache) */
const BG_IMAGES = [
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1400&h=560&fit=crop&q=70',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=560&fit=crop&q=70',
  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1400&h=560&fit=crop&q=70',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&h=560&fit=crop&q=70',
];

type BannerAnnonce = {
  id: string;
  title: string;
  price?: number;
  currency: string;
  slug: string;
  images: { url: string }[];
  category?: { nameFr: string };
  city?: { name: string };
};

export default function HeroBanner() {
  const [bgIdx, setBgIdx]           = useState(0);
  const [annonces, setAnnonces]     = useState<BannerAnnonce[]>([]);
  const [annonceIdx, setAnnonceIdx] = useState(0);
  const [ready, setReady]           = useState(false);

  /* Déclenche l'animation d'entrée un tick après le mount */
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* Rotation du fond toutes les 6 s */
  useEffect(() => {
    const t = setInterval(() => setBgIdx(i => (i + 1) % BG_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  /* Chargement des annonces vedettes */
  useEffect(() => {
    api.get('/annonces/banner').then(r => setAnnonces(r.data.data || [])).catch(() => {});
  }, []);

  /* Rotation des annonces toutes les 3,5 s */
  useEffect(() => {
    if (annonces.length <= 1) return;
    const t = setInterval(() => setAnnonceIdx(i => (i + 1) % annonces.length), 3500);
    return () => clearInterval(t);
  }, [annonces.length]);

  /* Helper : style d'animation d'entrée avec délai échelonné */
  const slide = (delay: number): React.CSSProperties => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'none' : 'translateY(14px)',
    transition: `opacity 700ms ease ${delay}ms, transform 700ms ease ${delay}ms`,
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary-900 mb-6">

      {/* ─── Fond défilant (crossfade lent) ──────────────────────────── */}
      {BG_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0"
          style={{
            opacity: i === bgIdx ? 1 : 0,
            transition: 'opacity 2000ms ease-in-out',
            zIndex: 0,
          }}
        >
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* ─── Dégradés superposés ─────────────────────────────────────── */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-900/75 to-primary-800/40"
        style={{ zIndex: 1 }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-primary-900/70 via-transparent to-transparent"
        style={{ zIndex: 1 }}
      />

      {/* ─── Blobs décoratifs ────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{ zIndex: 1, backgroundColor: 'rgba(34,197,94,0.12)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 left-1/3 w-72 h-72 rounded-full blur-3xl"
        style={{ zIndex: 1, backgroundColor: 'rgba(251,191,36,0.07)' }}
      />

      {/* ─── Contenu ─────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-10 p-7 md:p-12 min-h-[340px] md:min-h-[420px]"
        style={{ zIndex: 2 }}
      >

        {/* Texte + CTA */}
        <div className="flex-1 text-white">
          <p
            className="text-primary-300 font-semibold text-xs uppercase tracking-widest mb-3"
            style={slide(0)}
          >
            Bienvenue sur
          </p>

          <h1
            className="text-3xl md:text-5xl font-display font-bold leading-tight mb-3"
            style={slide(100)}
          >
            Trouve<span className="text-guinea-400">Tout</span><span className="text-gold-400">224</span>
          </h1>

          <p
            className="text-primary-200 text-base md:text-lg font-medium mb-1"
            style={slide(200)}
          >
            Le plus grand marché en ligne de Guinée
          </p>

          <p
            className="text-primary-300/70 text-sm mb-6 leading-relaxed max-w-xs"
            style={slide(300)}
          >
            Achetez, vendez, trouvez tout ce dont vous avez besoin — rapidement et gratuitement.
          </p>

          <div className="flex gap-3 flex-wrap" style={slide(400)}>
            <Link
              href="/annonces/lister"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg text-sm"
            >
              <Search size={15} /> Découvrir les offres
            </Link>
            <Link
              href="/annonces/publier"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/25 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
            >
              Publier une annonce
            </Link>
          </div>

          {/* Strip d'annonces horizontale — mobile uniquement */}
          {annonces.length > 0 && (
            <div
              className="md:hidden mt-5 flex gap-2 overflow-x-auto pb-1"
              style={slide(500)}
            >
              {annonces.slice(0, 5).map(a => (
                <Link
                  key={a.id}
                  href={`/annonces/${a.slug}`}
                  className="flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 border border-white/15 hover:bg-white/10 transition-colors max-w-[175px]"
                  style={{ backgroundColor: 'rgba(0,0,0,0.28)' }}
                >
                  {a.images?.[0] ? (
                    <img
                      src={a.images[0].url}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Tag size={14} className="text-white/35" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{a.title}</p>
                    {a.price ? (
                      <p className="text-gold-400 text-[10px] font-bold leading-tight">
                        {a.price.toLocaleString('fr-FR')} {a.currency}
                      </p>
                    ) : (
                      <p className="text-primary-300 text-[10px] leading-tight">Gratuit</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Panneau annonces — desktop uniquement */}
        {annonces.length > 0 && (
          <div
            className="hidden md:block w-72 lg:w-80 flex-shrink-0"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? 'translateX(0)' : 'translateX(20px)',
              transition: 'opacity 800ms ease 600ms, transform 800ms ease 600ms',
            }}
          >
            <div
              className="rounded-2xl overflow-hidden border border-white/15"
              style={{ backgroundColor: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(10px)' }}
            >
              {/* En-tête panneau */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-gold-400" />
                  <span className="text-white/75 text-xs font-semibold uppercase tracking-wide">
                    À la une
                  </span>
                </div>
                {/* Points de navigation annonces */}
                <div className="flex gap-1.5">
                  {annonces.slice(0, Math.min(annonces.length, 6)).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setAnnonceIdx(i)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === annonceIdx ? 16 : 6,
                        height: 6,
                        backgroundColor: i === annonceIdx
                          ? '#fbbf24'
                          : 'rgba(255,255,255,0.28)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Zone de la carte annonce (fade entre chaque) */}
              <div className="relative" style={{ height: 208 }}>
                {annonces.map((a, i) => (
                  <Link
                    key={a.id}
                    href={`/annonces/${a.slug}`}
                    className="absolute inset-0 flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group"
                    style={{
                      opacity: i === annonceIdx ? 1 : 0,
                      transition: 'opacity 600ms ease',
                      pointerEvents: i === annonceIdx ? 'auto' : 'none',
                    }}
                  >
                    {/* Photo */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/15 bg-white/10">
                      {a.images?.[0] ? (
                        <img
                          src={a.images[0].url}
                          alt={a.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag size={24} className="text-white/25" />
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-gold-300 transition-colors">
                        {a.title}
                      </p>
                      {a.price ? (
                        <p className="text-gold-400 font-bold text-xl leading-none">
                          {a.price.toLocaleString('fr-FR')}
                          <span className="text-xs font-normal ml-1 text-gold-400/60">{a.currency}</span>
                        </p>
                      ) : (
                        <p className="text-primary-300 text-sm font-semibold">Gratuit</p>
                      )}
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
                        {a.category && (
                          <span className="text-[10px] text-white/40 font-medium bg-white/10 px-1.5 py-0.5 rounded">
                            {a.category.nameFr}
                          </span>
                        )}
                        {a.city && (
                          <span className="flex items-center gap-0.5 text-[10px] text-white/40">
                            <MapPin size={9} />{a.city.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={14}
                      className="text-white/20 flex-shrink-0 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all"
                    />
                  </Link>
                ))}
              </div>

              {/* Pied panneau */}
              <div className="border-t border-white/10 px-4 py-2.5">
                <Link
                  href="/annonces/lister"
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
                >
                  Voir toutes les annonces <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Points navigation fond ───────────────────────────────────── */}
      <div className="absolute bottom-4 left-7 flex gap-1.5" style={{ zIndex: 3 }}>
        {BG_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setBgIdx(i)}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === bgIdx ? 20 : 6,
              height: 6,
              backgroundColor: i === bgIdx ? '#fbbf24' : 'rgba(255,255,255,0.28)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
