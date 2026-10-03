'use client';
// Carte d'annonce unique du site (maquette 2026-10) : sans cadre, image 4:3
// (1:1 sur mobile) arrondie, UN seul badge, bouton favori, titre / prix / méta.
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ImageIcon, Plus, Check, PackageSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ErrorState from '@/components/ui/ErrorState';
import { cloudinaryLoader } from '@/lib/cloudinary';
import { timeAgoShort, formatGnf } from '@/lib/format';
import { useSavedIds } from '@/hooks/useSavedIds';

interface Annonce {
  id: string; slug: string; title: string; price?: number | null; currency?: string;
  promoPrice?: number | null; promoEndsAt?: string | null; status?: string; isAgeRestricted?: boolean;
  images: { url: string }[]; city: { name: string }; category?: { nameFr: string; icon?: string };
  viewCount?: number; createdAt: string; isPremium?: boolean; isPinned?: boolean; neighborhood?: string | null;
  user?: { firstName?: string; lastName?: string; isVerified?: boolean; isShopVerified?: boolean; createdAt?: string };
  categoryId?: string;
  /** Emplacement payant (futur Pack Mansa) — toujours signalé « Sponsorisé ». */
  isSponsored?: boolean;
  /** Raison de présence dans le fil recommandé (voir backend services/ranking). */
  feedReason?: 'pour_toi' | 'decouverte' | 'populaire' | 'nouveau' | 'pres_de_toi';
}

const NEW_LISTING_MS = 3 * 24 * 60 * 60 * 1000;

/** Un seul badge : Vendu > 18+ > Sponsorisé > Vérifié > Nouveau. */
function badgeFor(a: Annonce, t: (k: string) => string): string | null {
  if (a.status === 'SOLD') return t('sold');
  if (a.isAgeRestricted) return '18+';
  if (a.isSponsored) return t('sponsored');
  if (a.user?.isVerified || a.user?.isShopVerified) return t('verified');
  if (Date.now() - new Date(a.createdAt).getTime() < NEW_LISTING_MS) return t('new');
  return null;
}

export function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const t = useTranslations('reco.card');
  const { saved, toggle } = useSavedIds();
  const isSaved = saved.has(annonce.id);
  const img = annonce.images?.[0]?.url;
  const badge = badgeFor(annonce, t);
  const promoActive = annonce.promoPrice != null && (!annonce.promoEndsAt || new Date(annonce.promoEndsAt) > new Date());
  const price = promoActive ? annonce.promoPrice : annonce.price;
  const place = annonce.neighborhood || annonce.city?.name;

  return (
    <Link href={`/annonces/${annonce.slug || annonce.id}`} className="annonce-card group block min-w-0">
      <div className="relative aspect-square sm:aspect-[4/3] rounded-[14px] sm:rounded-2xl overflow-hidden bg-tt-img">
        {img ? (
          <Image
            loader={cloudinaryLoader}
            src={img}
            alt={annonce.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 290px"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-tt-img2">
            <ImageIcon size={32} strokeWidth={1.75} className="text-tt-faint" />
          </div>
        )}
        {badge && (
          <span className="absolute top-2.5 left-2.5 px-[9px] py-[3px] rounded-full bg-tt-overlay text-white text-xs font-medium leading-[18px] backdrop-blur-sm">
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(annonce.id); }}
          aria-label={isSaved ? t('unsave') : t('save')}
          aria-pressed={isSaved}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-tt-overlay-soft text-white flex items-center justify-center backdrop-blur-sm hover:scale-105 transition-transform before:absolute before:-inset-1 before:content-['']"
        >
          <Heart size={16} strokeWidth={1.75} className={isSaved ? 'fill-[#E5484D] text-[#E5484D]' : ''} />
        </button>
      </div>

      <div className="mt-3">
        <h3 className="text-sm sm:text-[15px] font-medium text-tt-title truncate">{annonce.title}</h3>
        <p className="mt-1 leading-none">
          {price != null ? (
            <>
              <span className="font-display font-semibold text-base sm:text-lg text-tt-price">{formatGnf(price)}</span>
              <span className="text-[13px] text-tt-gnf"> GNF</span>
            </>
          ) : (
            <span className="text-[13px] text-tt-muted">{t('priceOnRequest')}</span>
          )}
        </p>
        <p className="mt-1.5 text-[13px] text-tt-muted truncate">{place} · {timeAgoShort(annonce.createdAt)}</p>
      </div>
    </Link>
  );
}

/** Squelette d'une carte — même forme que `AnnonceCard`. */
export function AnnonceCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-square sm:aspect-[4/3] rounded-[14px] sm:rounded-2xl" />
      <div className="skeleton h-4 w-3/4 rounded mt-3" />
      <div className="skeleton h-5 w-1/2 rounded mt-2" />
      <div className="skeleton h-3 w-2/3 rounded mt-2" />
    </div>
  );
}

export default function AnnonceGrid({
  annonces,
  isLoading,
  isError,
  error,
  onRetry,
  cols = 6,
  emptyTitle = 'Sois le premier à publier ici !',
  emptySubtitle = 'Cette section est encore vide — ta prochaine annonce pourrait être la première que les gens verront.',
  compareSelectedIds,
  onToggleCompare,
  compareDisabled,
}: {
  annonces?: Annonce[];
  isLoading?: boolean;
  /** Affiche l'état d'erreur (avec « Réessayer ») au lieu de l'état vide. */
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  cols?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Comparateur (voir /annonces/comparer) : quand fourni, affiche une case à cocher
   * sur chaque carte. Absent partout ailleurs — comportement inchangé par défaut. */
  compareSelectedIds?: string[];
  onToggleCompare?: (annonce: Annonce) => void;
  /** id des annonces dont la case doit être désactivée (catégorie différente / limite atteinte) */
  compareDisabled?: (annonce: Annonce) => boolean;
}) {
  const gridCols = cols === 4
    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  const grid = `grid ${gridCols} gap-x-3 gap-y-[18px] sm:gap-x-5 sm:gap-y-6`;

  if (isLoading) {
    return <div className={grid}>{Array.from({ length: 8 }).map((_, i) => <AnnonceCardSkeleton key={i} />)}</div>;
  }

  // L'erreur passe AVANT l'état vide : sans ça une panne réseau s'affiche
  // comme « aucune annonce », ce qui est faux et sans issue pour l'utilisateur.
  if (isError) {
    return <div className="rounded-2xl border border-tt-border bg-tt-card"><ErrorState error={error} onRetry={onRetry} /></div>;
  }

  if (!annonces || annonces.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-tt-dashed p-10 sm:p-12 text-center">
        <div className="w-14 h-14 bg-tt-green-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PackageSearch size={24} strokeWidth={1.75} className="text-tt-green-icon" />
        </div>
        <p className="font-display font-semibold text-tt-text text-base">{emptyTitle}</p>
        <p className="text-tt-muted text-sm mt-1 max-w-xs mx-auto">{emptySubtitle}</p>
        <Link href="/annonces/publier" className="inline-flex items-center gap-1.5 mt-5 h-10 px-4 rounded-xl bg-tt-gold text-tt-on-gold font-semibold text-sm">
          <Plus size={16} strokeWidth={2} /> Publier une annonce
        </Link>
      </div>
    );
  }

  return (
    <div className={`${grid} animate-fadeIn`}>
      {annonces.map((a) => {
        if (!onToggleCompare) return <AnnonceCard key={a.id} annonce={a} />;
        const checked = !!compareSelectedIds?.includes(a.id);
        const disabled = !checked && !!compareDisabled?.(a);
        return (
          <div key={a.id} className="relative">
            <AnnonceCard annonce={a} />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onToggleCompare(a); }}
              disabled={disabled}
              aria-pressed={checked}
              className={`absolute bottom-[86px] left-2.5 z-10 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors shadow-md before:absolute before:-inset-2 before:content-[''] ${
                checked
                  ? 'bg-tt-btn border-tt-btn text-white'
                  : disabled
                    ? 'bg-white/60 border-tt-border text-transparent cursor-not-allowed'
                    : 'bg-white/90 border-tt-border-strong hover:border-tt-green'
              }`}
            >
              {checked && <Check size={14} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
