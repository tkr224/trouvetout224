'use client';
import Link from 'next/link';
import { Heart, Eye, MapPin, BadgeCheck, ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Annonce {
  id: string; slug: string; title: string; price?: number; currency?: string;
  images: { url: string }[]; city: { name: string }; category: { nameFr: string; icon: string };
  viewCount: number; createdAt: string; isPremium: boolean; neighborhood?: string;
  user: { firstName: string; lastName: string; isVerified: boolean };
}

export function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const img = annonce.images?.[0]?.url;
  const timeAgo = formatDistanceToNow(new Date(annonce.createdAt), { addSuffix: true, locale: fr });

  return (
    <Link href={`/annonces/${annonce.slug || annonce.id}`} className="card block group overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-dark-100">
        {img ? (
          <img src={img} alt={annonce.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-dark-100">
            <ImageIcon size={36} className="text-dark-300" />
          </div>
        )}
        {annonce.isPremium && (
          <div className="absolute top-2.5 left-2.5 bg-gold-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
            ⭐ À la une
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-2.5 right-2.5 w-9 h-9 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all group/heart"
        >
          <Heart size={15} className="text-dark-400 group-hover/heart:text-guinea-500 transition-colors" />
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-dark-900 text-sm line-clamp-1 group-hover:text-primary-700 transition-colors">{annonce.title}</h3>
        {annonce.price != null ? (
          <p className="text-primary-700 font-bold text-base mt-1">{annonce.price.toLocaleString('fr-GN')} <span className="text-xs font-medium">GNF</span></p>
        ) : (
          <p className="text-dark-400 text-sm mt-1 italic">Prix à négocier</p>
        )}
        <div className="flex items-center gap-1 text-dark-400 text-xs mt-2">
          <MapPin size={11} />
          <span className="line-clamp-1">{annonce.city?.name}{annonce.neighborhood && `, ${annonce.neighborhood}`}</span>
        </div>
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-dark-50">
          <span className="text-dark-400 text-[11px]">{timeAgo}</span>
          <span className="flex items-center gap-1 text-dark-400 text-[11px]"><Eye size={11} /> {annonce.viewCount}</span>
        </div>
      </div>
    </Link>
  );
}

export default function AnnonceGrid({ annonces, isLoading, cols = 6 }: { annonces?: Annonce[]; isLoading?: boolean; cols?: number }) {
  const gridCols = cols === 4
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';

  if (isLoading) {
    return (
      <div className={`grid ${gridCols} gap-4`}>
        {Array.from({ length: cols === 4 ? 4 : 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="skeleton aspect-[4/3]" />
            <div className="p-3 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-5 w-1/2" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!annonces || annonces.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 bg-dark-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ImageIcon size={28} className="text-dark-300" />
        </div>
        <p className="font-semibold text-dark-700">Aucune annonce pour le moment</p>
        <p className="text-dark-400 text-sm mt-1">Revenez bientôt ou publiez la première !</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {annonces.map((a) => <AnnonceCard key={a.id} annonce={a} />)}
    </div>
  );
}