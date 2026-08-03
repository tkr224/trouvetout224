'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnnonceGrid from '@/components/annonces/AnnonceGrid';
import CulturalPattern from '@/components/CulturalPattern';
import ScrollReveal from '@/components/ScrollReveal';
import BackButton from '@/components/BackButton';
import { CATEGORY_ICON_MAP, CATEGORY_ICON_FALLBACK } from '@/components/annonces/CategoryGrid';
import { api } from '@/lib/api';
import { useAnnonces } from '@/hooks/useAnnonces';

export default function CategoryPage() {
  const t = useTranslations('categories');
  const { slug } = useParams();
  const [category, setCategory] = useState<any>(null);
  const [activeSub, setActiveSub] = useState<string>('');

  useEffect(() => {
    api.get(`/categories/${slug}`).then(r => setCategory(r.data.data)).catch(() => {});
  }, [slug]);

  const { data, isLoading } = useAnnonces({
    categoryId: (activeSub || slug) as string,
    limit: 20,
  });

  const HeroIcon = CATEGORY_ICON_MAP[category?.slug] || CATEGORY_ICON_FALLBACK;

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="relative isolate overflow-hidden max-w-7xl mx-auto px-4 py-8">
        <CulturalPattern />
        <BackButton label={category?.nameFr || t('breadcrumbHome')} fallbackHref="/" className="mb-2" />
        <nav className="flex items-center gap-2 text-sm text-dark-500 dark:text-dark-300 mb-6">
          <Link href="/" className="hover:text-primary-700 dark:hover:text-primary-300 transition-colors">{t('breadcrumbHome')}</Link><span>/</span>
          <span className="text-dark-700 dark:text-dark-200">{category?.nameFr || '...'}</span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-14 h-14 shrink-0">
            <div className="absolute inset-0 rounded-2xl blur-lg bg-primary-300/40 dark:bg-primary-600/20" />
            <div
              className="relative w-full h-full rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: (category?.color || '#1B8B3B') + '20' }}
            >
              <HeroIcon size={26} style={{ color: category?.color || '#1B8B3B' }} strokeWidth={2} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-white">{category?.nameFr}</h1>
            <p className="text-dark-500 dark:text-dark-300 text-sm">{t('resultsCount', { count: data?.pagination?.total || 0 })}</p>
          </div>
        </div>

        {/* Sous-catégories */}
        {category?.children?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <button onClick={() => setActiveSub('')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!activeSub ? 'bg-primary-700 text-white shadow-premium' : 'bg-dark-50 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-primary-50 dark:hover:bg-primary-900/30'}`}>
              {t('viewAll')}
            </button>
            {category.children.map((sub: any) => {
              const SubIcon = CATEGORY_ICON_MAP[sub.slug] || CATEGORY_ICON_FALLBACK;
              return (
                <button key={sub.id} onClick={() => setActiveSub(sub.slug)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${activeSub === sub.slug ? 'bg-primary-700 text-white shadow-premium' : 'bg-dark-50 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-primary-50 dark:hover:bg-primary-900/30'}`}>
                  <SubIcon size={14} /> {sub.nameFr}
                </button>
              );
            })}
          </div>
        )}

        <ScrollReveal>
          <AnnonceGrid annonces={data?.data} isLoading={isLoading} />
        </ScrollReveal>
      </div>
      <Footer />
    </div>
  );
}