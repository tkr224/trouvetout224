'use client';
import Link from 'next/link';
import { Heart, Eye, MapPin, BadgeCheck, ImageIcon, Star, Sparkles, Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Annonce {
  id: string; slug: string; title: string; price?: number; currency?: string;
  promoPrice?: number; promoEndsAt?: string; status?: string;
  images: { url: string }[]; city: { name: string }; category: { nameFr: string; icon: string };
  viewCount: number; createdAt: string; isPremium: boolean; isPinned?: boolean; neighborhood?: string;
  user: { firstName: string; lastName: string; isVerified: boolean; isShopVerified?: boolean; createdAt?: string };
}

export function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const img = annonce.images?.[0]?.url;
  const timeAgo = formatDistanceToNow(new Date(annonce.createdAt), { addSuffix: true, locale: fr });
  const isNewSeller = annonce.user?.createdAt
    ? (Date.now() - new Date(annonce.user.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;

  const promoActive = annonce.promoPrice != null
    && (!annonce.promoEndsAt || new Date(annonce.promoEndsAt) > new Date());

  return (
    <Link href={`/annonces/${annonce.slug || annonce.id}`} className="card annonce-card block group overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-dark-100">
        {img ? (
          <img src={img} alt={annonce.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-dark-100">
            <ImageIcon size={36} className="text-dark-300" />
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {annonce.status === 'SOLD' && (
            <div className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <CheckCircle2 size={10} /> Vendu
            </div>
          )}
          {annonce.isPremium && annonce.status !== 'SOLD' && (
            <div className="bg-gold-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <Star size={10} className="fill-white text-white" /> À la une
            </div>
          )}
          {promoActive && annonce.status !== 'SOLD' && (
            <div className="bg-guinea-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <Tag size={10} /> Promo
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-2.5 right-2.5 w-9 h-9 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all group/heart"
        >
          <Heart size={15} className="text-dark-400 group-hover/heart:text-guinea-500 transition-colors" />
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-dark-900 text-sm line-clamp-1 group-hover:text-primary-700 transition-colors">{annonce.title}</h3>

        {/* Prix : affiche promo si active, sinon prix normal */}
        {promoActive ? (
          <div className="mt-1">
            <span className="text-guinea-600 font-bold text-base">
              {annonce.promoPrice!.toLocaleString('fr-GN')} <span className="text-xs font-medium">GNF</span>
            </span>
            {annonce.price != null && (
              <span className="ml-2 text-dark-400 text-sm line-through">
                {annonce.price.toLocaleString('fr-GN')} GNF
              </span>
            )}
          </div>
        ) : annonce.price != null ? (
          <p className="text-gold-600 font-bold text-base mt-1">{annonce.price.toLocaleString('fr-GN')} <span className="text-xs font-medium">GNF</span></p>
        ) : (
          <p className="text-dark-400 text-sm mt-1 italic">Prix à négocier</p>
        )}

        <div className="flex items-center gap-1 text-dark-400 text-xs mt-2">
          <MapPin size={11} />
          <span className="line-clamp-1">{annonce.city?.name}{annonce.neighborhood && `, ${annonce.neighborhood}`}</span>
        </div>

        {(annonce.user?.isVerified || annonce.user?.isShopVerified || isNewSeller) && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {annonce.user?.isShopVerified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-gold-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">
                <ShieldCheck size={9} /> Boutique vérifiée
              </span>
            )}
            {annonce.user?.isVerified && !annonce.user?.isShopVerified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                <BadgeCheck size={9} /> Vérifié
              </span>
            )}
            {isNewSeller && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded-full">
                <Sparkles size={9} /> Nouveau
              </span>
            )}
          </div>
        )}
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