'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { History } from 'lucide-react';
import { api } from '@/lib/api';
import { AnnonceCard } from '@/components/annonces/AnnonceGrid';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

// Section « Récemment consultées » réutilisable — valide les annonces stockées
// en local contre leur statut réel en base (retire les vendues/masquées/supprimées)
// avant affichage, pour ne jamais pointer vers du contenu qui n'existe plus.
export default function RecentlyViewedSection({ excludeId }: { excludeId?: string }) {
  const t = useTranslations('annonces.detail.recent');
  const { items, hasLoaded, removeById } = useRecentlyViewed();
  const [validated, setValidated] = useState<any[]>([]);

  useEffect(() => {
    if (!hasLoaded) return;
    const toCheck = items.filter(a => a.id !== excludeId);
    if (toCheck.length === 0) { setValidated([]); return; }

    Promise.allSettled(toCheck.map(item => api.get(`/annonces/${item.id}`))).then(results => {
      const valid: any[] = [];
      results.forEach((res, i) => {
        const active = res.status === 'fulfilled' && res.value.data?.data?.status === 'ACTIVE';
        if (active) valid.push(toCheck[i]);
        else removeById(toCheck[i].id);
      });
      setValidated(valid);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded, items.length, excludeId]);

  if (validated.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <History size={18} className="text-dark-400" />
        <div>
          <h2 className="font-display font-bold text-dark-900">{t('title')}</h2>
          <p className="text-dark-400 text-xs">{t('subtitle')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {validated.slice(0, 8).map((a: any) => (
          <AnnonceCard key={a.id} annonce={a} />
        ))}
      </div>
    </section>
  );
}
