'use client';
export const dynamic = 'force-dynamic';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

function RedirectContent() {
  const t = useTranslations('annonces.redirect');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(`/annonces/lister${params ? '?' + params : ''}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-dark-500">{t('loading')}</p>
      </div>
    </div>
  );
}

export default function AnnoncesRedirect() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin" /></div>}>
      <RedirectContent />
    </Suspense>
  );
}