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

    // Un seul appel réseau pour valider tout le lot (au lieu d'un GET détail par
    // annonce, qui rechargeait aussi ~6 annonces similaires par item pour un simple
    // widget de vignettes). `?ids=` ne garantit pas l'ordre renvoyé, donc on retrie
    // selon l'ordre "récemment consulté" de toCheck.
    const idsParam = toCheck.map(item => item.id).join(',');
    api.get(`/annonces?ids=${idsParam}`).then(res => {
      const found: any[] = res.data?.data || [];
      const byId = new Map(found.map((a: any) => [a.id, a]));
      const valid: any[] = [];
      toCheck.forEach(item => {
        const match = byId.get(item.id);
        if (match) valid.push(match);
        else removeById(item.id);
      });
      setValidated(valid);
    }).catch(() => {});
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
