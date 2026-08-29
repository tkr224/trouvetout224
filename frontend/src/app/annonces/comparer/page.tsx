'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import BackButton from '@/components/BackButton';
import { api } from '@/lib/api';
import { Loader2, X, MapPin, ImageIcon, Scale } from 'lucide-react';

interface AnnonceFull {
  id: string; slug: string; title: string; price: number | null; currency: string;
  images: { url: string }[]; city: { name: string }; category: { nameFr: string };
  neighborhood: string | null; condition: string | null; quantity: number | null;
  bedrooms: number | null; surface: number | null; vehicleMake: string | null;
  vehicleModel: string | null; vehicleYear: number | null; vehicleMileage: number | null;
  vehicleFuel: string | null; vehicleTransmission: string | null;
}

// Réutilise les libellés déjà traduits de la fiche annonce (annonces.detail.specs)
// plutôt que de dupliquer ~10 clés dans les 3 langues.
function specsFor(a: AnnonceFull, tSpecs: any): { label: string; value: string }[] {
  return [
    a.condition != null && { label: tSpecs('condition'), value: a.condition },
    a.quantity != null && { label: tSpecs('quantity'), value: String(a.quantity) },
    a.bedrooms != null && { label: tSpecs('bedrooms'), value: String(a.bedrooms) },
    a.surface != null && { label: tSpecs('surface'), value: `${a.surface} m²` },
    a.vehicleMake != null && { label: tSpecs('vehicleMake'), value: a.vehicleMake },
    a.vehicleModel != null && { label: tSpecs('vehicleModel'), value: a.vehicleModel },
    a.vehicleYear != null && { label: tSpecs('vehicleYear'), value: String(a.vehicleYear) },
    a.vehicleMileage != null && { label: tSpecs('vehicleMileage'), value: `${Number(a.vehicleMileage).toLocaleString('fr-GN')} km` },
    a.vehicleFuel != null && { label: tSpecs('vehicleFuel'), value: a.vehicleFuel },
    a.vehicleTransmission != null && { label: tSpecs('vehicleTransmission'), value: a.vehicleTransmission },
  ].filter(Boolean) as { label: string; value: string }[];
}

function CompareContent() {
  const t = useTranslations('annonces.listPage.compare');
  const tSpecs = useTranslations('annonces.detail.specs');
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 3);
  const [annonces, setAnnonces] = useState<AnnonceFull[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length < 2) { setLoading(false); return; }
    setLoading(true);
    Promise.all(ids.map(id => api.get(`/annonces/${id}`).then(r => r.data.data).catch(() => null)))
      .then(results => setAnnonces(results.filter(Boolean)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const removeOne = (id: string) => {
    const remaining = ids.filter(i => i !== id);
    if (remaining.length < 2) { router.push('/annonces/lister'); return; }
    router.push(`/annonces/comparer?ids=${remaining.join(',')}`);
  };

  // Union de tous les libellés de specs présents sur au moins une des annonces —
  // pour que chaque ligne du tableau reste alignée même si toutes n'ont pas les
  // mêmes caractéristiques renseignées.
  const allSpecLabels = Array.from(new Set(annonces.flatMap(a => specsFor(a, tSpecs).map(s => s.label))));

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <BackButton label={t('title')} fallbackHref="/annonces/lister" className="mb-2 -mt-1" />
        <h1 className="font-display font-bold text-2xl text-dark-900 flex items-center gap-2 mb-1">
          <Scale size={22} className="text-primary-700" /> {t('title')}
        </h1>
        <p className="text-dark-500 text-sm mb-6">{t('subtitle')}</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
        ) : ids.length < 2 || annonces.length < 2 ? (
          <div className="card p-10 text-center">
            <p className="text-dark-500 mb-4">{t('notEnough')}</p>
            <Link href="/annonces/lister" className="btn-primary inline-flex">{t('backToList')}</Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className="text-left p-2 w-32" />
                  {annonces.map(a => (
                    <th key={a.id} className="p-2 align-top">
                      <div className="card p-3 relative">
                        <button
                          onClick={() => removeOne(a.id)}
                          aria-label={t('removeBtn')}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-dark-400 hover:bg-guinea-50 hover:text-guinea-600 transition-colors shadow-sm z-10"
                        >
                          <X size={14} />
                        </button>
                        <Link href={`/annonces/${a.slug || a.id}`} className="block">
                          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-dark-100 mb-2">
                            {a.images?.[0]?.url ? (
                              <img src={a.images[0].url} alt={a.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon size={28} className="text-dark-300" /></div>
                            )}
                          </div>
                          <p className="font-semibold text-dark-900 text-sm line-clamp-2 hover:text-primary-700 transition-colors">{a.title}</p>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-dark-100">
                  <td className="p-3 text-sm font-semibold text-dark-600">{t('rowPrice')}</td>
                  {annonces.map(a => (
                    <td key={a.id} className="p-3 text-center font-bold text-primary-700">
                      {a.price != null ? `${a.price.toLocaleString('fr-GN')} GNF` : t('negotiable')}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-dark-100 bg-dark-50/60">
                  <td className="p-3 text-sm font-semibold text-dark-600">{t('rowLocation')}</td>
                  {annonces.map(a => (
                    <td key={a.id} className="p-3 text-center text-sm text-dark-700">
                      <span className="inline-flex items-center gap-1"><MapPin size={12} className="text-dark-400" /> {a.city?.name}{a.neighborhood ? ` · ${a.neighborhood}` : ''}</span>
                    </td>
                  ))}
                </tr>
                {allSpecLabels.map((label, i) => (
                  <tr key={label} className={`border-t border-dark-100 ${i % 2 === 1 ? 'bg-dark-50/60' : ''}`}>
                    <td className="p-3 text-sm font-semibold text-dark-600">{label}</td>
                    {annonces.map(a => {
                      const spec = specsFor(a, tSpecs).find(s => s.label === label);
                      return (
                        <td key={a.id} className="p-3 text-center text-sm text-dark-700">
                          {spec ? spec.value : <span className="text-dark-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-50" />}>
      <CompareContent />
    </Suspense>
  );
}
