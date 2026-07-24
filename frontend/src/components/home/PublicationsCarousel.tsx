'use client';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

type PubType = 'BANNER' | 'EVENT' | 'FEATURED_VENDOR';
export type Publication = {
  id: string; type: PubType; title: string; subtitle?: string;
  image?: string; link?: string; eventDate?: string; eventLocation?: string;
};
const PUB_GRADIENT: Record<PubType, string> = {
  BANNER:          'from-primary-700 to-primary-800',
  EVENT:           'from-blue-700 to-blue-900',
  FEATURED_VENDOR: 'from-amber-500 to-amber-700',
};
const PUB_BADGE_KEY: Record<PubType, 'banner' | 'event' | 'featuredVendor'> = {
  BANNER:          'banner',
  EVENT:           'event',
  FEATURED_VENDOR: 'featuredVendor',
};

function SlideContent({ pub }: { pub: Publication }) {
  const t = useTranslations('accueil.publications');
  return (
    <div className={`relative h-36 sm:h-44 bg-gradient-to-r ${PUB_GRADIENT[pub.type]} flex items-center px-6 sm:px-8 overflow-hidden`}>
      {pub.image && (
        <div className="absolute inset-y-0 right-0 w-2/5 sm:w-1/3">
          <img src={pub.image} alt="" className="w-full h-full object-cover opacity-30 sm:opacity-60" />
        </div>
      )}
      <div className="relative z-10 max-w-xs sm:max-w-md">
        <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold mb-2">{t(PUB_BADGE_KEY[pub.type])}</span>
        <h3 className="text-white font-display font-bold text-lg sm:text-xl leading-tight mb-1">{pub.title}</h3>
        {pub.eventDate && (
          <p className="text-white/70 text-xs mt-1.5 flex items-center gap-1">
            <Calendar size={11} />
            {new Date(pub.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {pub.eventLocation && ` · ${pub.eventLocation}`}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PublicationsCarousel({ pubs }: { pubs: Publication[] }) {
  const [active, setActive] = useState(0);
  const next = useCallback(() => setActive(i => (i + 1) % pubs.length), [pubs.length]);
  const prev = useCallback(() => setActive(i => (i - 1 + pubs.length) % pubs.length), [pubs.length]);
  useEffect(() => {
    if (pubs.length <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next, pubs.length]);
  if (!pubs.length) return null;
  const pub = pubs[active];
  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="relative rounded-xl overflow-hidden shadow-card-hover isolate">
        {pubs.map((_, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} />
        ))}
        {pub.link ? <Link href={pub.link}><SlideContent pub={pub} /></Link> : <SlideContent pub={pub} />}
        {pubs.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"><ChevronLeft size={14} /></button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"><ChevronRight size={14} /></button>
            <div className="absolute bottom-2.5 left-0 right-0 z-20 flex justify-center gap-1.5">
              {pubs.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
