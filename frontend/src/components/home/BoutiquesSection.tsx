'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Store, ShieldCheck, Package, ArrowRight, Plus, MapPin } from 'lucide-react';
import { useShops, type Shop } from '@/hooks/useShops';

function ShopCard({ shop }: { shop: Shop }) {
  const t = useTranslations('accueil.boutiquesSection');
  const displayName = shop.shopName || `${shop.firstName} ${shop.lastName}`;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/profil/${shop.id}`}
      className="glow-on-hover card flex flex-col"
    >
      {/* Bannière */}
      <div className="relative h-20 shrink-0">
        {shop.shopBanner ? (
          <img src={shop.shopBanner} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-700 via-primary-600 to-guinea-600" />
        )}
      </div>

      <div className="p-4 pt-0 flex-1 flex flex-col">
        {/* Logo à cheval sur la bannière */}
        <div className="-mt-7 mb-2.5">
          {shop.shopLogo ? (
            <img src={shop.shopLogo} alt={displayName} className="w-14 h-14 rounded-xl object-cover border-2 border-white dark:border-dark-900 shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/40 border-2 border-white dark:border-dark-900 shadow-sm flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
              {initials}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-dark-900 dark:text-white truncate">{displayName}</p>
          {shop.isVerified && <ShieldCheck size={14} className="text-primary-700 dark:text-primary-400 shrink-0" />}
        </div>
        {shop.shopSlogan ? (
          <p className="text-dark-500 dark:text-dark-400 text-xs mt-0.5 line-clamp-1 italic">{shop.shopSlogan}</p>
        ) : shop.city ? (
          <p className="text-dark-400 text-xs mt-0.5 flex items-center gap-1"><MapPin size={10} />{shop.city.name}</p>
        ) : null}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-50 dark:border-dark-700 mt-auto">
          <span className="flex items-center gap-1 text-xs text-dark-500 dark:text-dark-400">
            <Package size={12} className="text-primary-600 dark:text-primary-400" />
            {t('listings', { count: shop._count.annonces })}
          </span>
          <ArrowRight size={14} className="text-dark-300 dark:text-dark-600" />
        </div>
      </div>
    </Link>
  );
}

export default function BoutiquesSection() {
  const t = useTranslations('accueil.boutiquesSection');
  const { data: shops, isLoading } = useShops(6);

  return (
    <section className="max-w-7xl mx-auto px-4 py-7 w-full">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1 w-4 bg-guinea-500 rounded-full" />
            <span className="text-xs font-bold text-guinea-600 dark:text-guinea-400 uppercase tracking-wider">{t('kicker')}</span>
          </div>
          <h2 className="text-xl font-display font-bold text-dark-900 dark:text-white">{t('title')}</h2>
          <p className="text-dark-400 text-xs mt-0.5">{t('subtitle')}</p>
        </div>
        <Link href="/boutiques" className="hidden sm:flex items-center gap-1 text-primary-700 dark:text-primary-400 font-semibold text-sm hover:gap-2 transition-all">
          {t('viewAll')} <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : shops && shops.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
        </div>
      ) : (
        <div className="card p-10 sm:p-12 text-center bg-gradient-to-b from-guinea-50/60 to-transparent dark:from-guinea-900/10">
          <div className="w-16 h-16 bg-guinea-100 dark:bg-guinea-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store size={28} className="text-guinea-600 dark:text-guinea-400" />
          </div>
          <p className="font-bold text-dark-900 dark:text-white text-base">{t('emptyTitle')}</p>
          <p className="text-dark-400 text-sm mt-1 max-w-sm mx-auto">{t('emptyDesc')}</p>
          <Link
            href="/vendeur/boutique"
            className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-guinea-600 hover:bg-guinea-700 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
          >
            <Plus size={15} /> {t('emptyCta')}
          </Link>
        </div>
      )}
    </section>
  );
}
