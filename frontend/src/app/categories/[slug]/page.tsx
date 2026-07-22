'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnnonceGrid from '@/components/annonces/AnnonceGrid';
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-dark-500 mb-6">
          <Link href="/" className="hover:text-primary-700">{t('breadcrumbHome')}</Link><span>/</span>
          <span className="text-dark-700">{category?.nameFr || '...'}</span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: (category?.color || '#1B8B3B') + '20' }}>
            {category?.icon}
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-dark-900">{category?.nameFr}</h1>
            <p className="text-dark-500 text-sm">{t('resultsCount', { count: data?.pagination?.total || 0 })}</p>
          </div>
        </div>

        {/* Sous-catégories */}
        {category?.children?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <button onClick={() => setActiveSub('')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!activeSub ? 'bg-primary-700 text-white' : 'bg-dark-50 text-dark-600 hover:bg-primary-50'}`}>
              {t('viewAll')}
            </button>
            {category.children.map((sub: any) => (
              <button key={sub.id} onClick={() => setActiveSub(sub.slug)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${activeSub === sub.slug ? 'bg-primary-700 text-white' : 'bg-dark-50 text-dark-600 hover:bg-primary-50'}`}>
                <span>{sub.icon}</span> {sub.nameFr}
              </button>
            ))}
          </div>
        )}

        <AnnonceGrid annonces={data?.data} isLoading={isLoading} />
      </div>
      <Footer />
    </div>
  );
}