'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import CulturalPattern from '@/components/CulturalPattern';
import PageViewTracker from '@/components/PageViewTracker';
import Footer from '@/components/layout/Footer';
import AnnonceGrid from '@/components/annonces/AnnonceGrid';
import { useAnnonces } from '@/hooks/useAnnonces';
import { api } from '@/lib/api';
import {
  Search, Filter, X, ChevronDown, Clock, TrendingUp, ArrowUp, ArrowDown,
  RotateCcw, Eye, Star, SlidersHorizontal, CheckCircle, Bookmark,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const SORTS = [
  { v: 'recent',     l: 'Plus récents',     Icon: Clock },
  { v: 'popular',    l: 'Plus populaires',  Icon: TrendingUp },
  { v: 'views',      l: 'Plus consultés',   Icon: Eye },
  { v: 'price_asc',  l: 'Prix croissant',   Icon: ArrowUp },
  { v: 'price_desc', l: 'Prix décroissant', Icon: ArrowDown },
  { v: 'rating',     l: 'Meilleures notes', Icon: Star },
];

const CONDITIONS = ['Neuf', 'Comme neuf', 'Bon état', 'Occasion'];

const selectCls = 'w-full border border-dark-200 rounded-xl px-3 py-2.5 text-sm text-dark-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none cursor-pointer';
const inputCls  = 'w-full border border-dark-200 rounded-xl px-3 py-2.5 text-sm text-dark-900 placeholder-dark-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all';

/* ── Label de section sidebar ─────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pl-2.5 border-l-2 border-primary-500 text-[10px] font-bold text-dark-600 uppercase tracking-widest mb-2.5">
      {children}
    </p>
  );
}

/* ── Sidebar filtres ───────────────────────────────────────────────── */
function FilterSidebar({
  categories, cat, setCat, subcat, setSubcat,
  selectedCity, setSelectedCity,
  minPrice, setMinPrice, maxPrice, setMaxPrice,
  condition, setCondition, onReset, hasFilters,
}: {
  categories: any[];
  cat: string; setCat: (v: string) => void;
  subcat: string; setSubcat: (v: string) => void;
  selectedCity: string; setSelectedCity: (v: string) => void;
  minPrice: string; setMinPrice: (v: string) => void;
  maxPrice: string; setMaxPrice: (v: string) => void;
  condition: string; setCondition: (v: string) => void;
  onReset: () => void; hasFilters: boolean;
}) {
  const selectedCatObj = categories.find((c: any) => c.slug === cat);
  const subcategories: any[] = selectedCatObj?.children || [];

  return (
    <div className="space-y-5">

      {/* Catégorie */}
      <div>
        <SectionLabel>Catégorie</SectionLabel>
        <div className="relative">
          <select value={cat} onChange={e => { setCat(e.target.value); setSubcat(''); }} className={selectCls}>
            <option value="">Toutes les catégories</option>
            {categories.map((c: any) => (
              <option key={c.slug} value={c.slug}>{c.nameFr || c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        </div>
      </div>

      {/* Sous-catégorie */}
      {subcategories.length > 0 && (
        <div>
          <SectionLabel>Sous-catégorie</SectionLabel>
          <div className="relative">
            <select value={subcat} onChange={e => setSubcat(e.target.value)} className={selectCls}>
              <option value="">Toutes</option>
              {subcategories.map((s: any) => (
                <option key={s.slug} value={s.slug}>{s.nameFr || s.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="h-px bg-gradient-to-r from-dark-100 via-dark-100 to-transparent" />

      {/* Ville */}
      <div>
        <SectionLabel>Ville</SectionLabel>
        <div className="relative">
          <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className={selectCls}>
            <option value="">Toutes les villes</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-dark-100 via-dark-100 to-transparent" />

      {/* Prix */}
      <div>
        <SectionLabel>Fourchette de prix (GNF)</SectionLabel>
        <div className="space-y-2">
          <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Minimum" className={inputCls} />
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-dark-100" />
            <span className="text-[10px] text-dark-300 font-medium">à</span>
            <div className="h-px flex-1 bg-dark-100" />
          </div>
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Maximum" className={inputCls} />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-dark-100 via-dark-100 to-transparent" />

      {/* État */}
      <div>
        <SectionLabel>État du produit</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setCondition('')}
            className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold transition-all border ${
              !condition ? 'bg-primary-700 text-white border-primary-700 shadow-premium' : 'bg-white text-dark-600 border-dark-200 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            {!condition && <CheckCircle size={11} />} Tous
          </button>
          {CONDITIONS.map(c => (
            <button
              key={c}
              onClick={() => setCondition(condition === c ? '' : c)}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold transition-all border ${
                condition === c ? 'bg-primary-700 text-white border-primary-700 shadow-premium' : 'bg-white text-dark-600 border-dark-200 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              {condition === c && <CheckCircle size={11} />} {c}
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <>
          <div className="h-px bg-gradient-to-r from-dark-100 via-dark-100 to-transparent" />
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-primary-200 text-sm font-semibold text-primary-700 hover:bg-primary-50 transition-colors"
          >
            <RotateCcw size={13} /> Réinitialiser les filtres
          </button>
        </>
      )}
    </div>
  );
}

/* ── Corps de la liste ─────────────────────────────────────────────── */
function AnnoncesList() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [sort, setSort]               = useState(searchParams.get('sort') || 'recent');
  const [cat, setCat]                 = useState(searchParams.get('cat') || '');
  const [subcat, setSubcat]           = useState('');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [minPrice, setMinPrice]       = useState('');
  const [maxPrice, setMaxPrice]       = useState('');
  const [condition, setCondition]     = useState('');
  const [page, setPage]               = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get('q') || '');
  const [q, setQ]                     = useState(searchParams.get('q') || '');

  useEffect(() => {
    const t = setTimeout(() => { setQ(localSearch); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [localSearch]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  const activeCatId = subcat || cat || undefined;

  const { data, isLoading } = useAnnonces({
    sort, categoryId: activeCatId, q: q || undefined, limit: 20, page,
    cityId: selectedCity || undefined,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    condition: condition || undefined,
  });

  const handleReset = () => {
    setCat(''); setSubcat(''); setSelectedCity(''); setMinPrice('');
    setMaxPrice(''); setCondition(''); setLocalSearch(''); setQ(''); setPage(1);
  };

  const selectedCatObj = categories.find((c: any) => c.slug === cat);
  const catLabel    = selectedCatObj?.nameFr || cat;
  const subcatLabel = selectedCatObj?.children?.find((s: any) => s.slug === subcat)?.nameFr || subcat;

  const activeFilters = [
    cat          && { key: 'cat',    label: catLabel,                                               clear: () => { setCat(''); setSubcat(''); setPage(1); } },
    subcat       && { key: 'subcat', label: subcatLabel,                                             clear: () => { setSubcat(''); setPage(1); } },
    selectedCity && { key: 'city',   label: selectedCity,                                            clear: () => { setSelectedCity(''); setPage(1); } },
    condition    && { key: 'cond',   label: condition,                                               clear: () => { setCondition(''); setPage(1); } },
    minPrice     && { key: 'min',    label: `≥ ${parseInt(minPrice).toLocaleString('fr-FR')} GNF`,  clear: () => { setMinPrice(''); setPage(1); } },
    maxPrice     && { key: 'max',    label: `≤ ${parseInt(maxPrice).toLocaleString('fr-FR')} GNF`,  clear: () => { setMaxPrice(''); setPage(1); } },
    q            && { key: 'q',      label: `"${q}"`,                                               clear: () => { setLocalSearch(''); setQ(''); setPage(1); } },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const hasFilters = activeFilters.length > 0;
  const total      = data?.pagination?.total ?? 0;

  const saveSearch = async () => {
    if (!isAuthenticated) { toast.error('Connectez-vous pour sauvegarder une recherche'); return; }
    try {
      await api.post('/saved-searches', {
        keyword: q || undefined,
        categoryId: activeCatId || undefined,
        cityId: selectedCity || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        condition: condition || undefined,
      });
      toast.success('Recherche sauvegardée !');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
  };
  const isEmpty    = !isLoading && data && (!data.data || data.data.length === 0);

  const filterProps = {
    categories,
    cat, setCat: (v: string) => { setCat(v); setPage(1); },
    subcat, setSubcat: (v: string) => { setSubcat(v); setPage(1); },
    selectedCity, setSelectedCity: (v: string) => { setSelectedCity(v); setPage(1); },
    minPrice, setMinPrice, maxPrice, setMaxPrice,
    condition, setCondition: (v: string) => { setCondition(v); setPage(1); },
    onReset: handleReset, hasFilters,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── Sidebar filtres (desktop) ───────────────────────── */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-dark-100 shadow-card overflow-hidden sticky top-24">
          <div className="bg-primary-700 px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-white flex items-center gap-2">
              <SlidersHorizontal size={15} /> Filtres
            </h2>
            {hasFilters && (
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeFilters.length} actif{activeFilters.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="p-5">
            <FilterSidebar {...filterProps} />
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ───────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Barre de recherche + bouton filtres mobile */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Rechercher une annonce..."
              className="w-full border border-dark-200 rounded-xl pl-10 pr-9 py-3 text-sm text-dark-900 placeholder-dark-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-dark-200 hover:bg-dark-300 text-dark-600 flex items-center justify-center transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`lg:hidden flex items-center gap-1.5 px-3.5 py-3 rounded-xl border text-sm font-semibold transition-all shadow-sm ${
              hasFilters || showFilters
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-dark-700 border-dark-200 hover:border-primary-400 hover:text-primary-700'
            }`}
          >
            <Filter size={14} />
            Filtres
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-white/25 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Panel filtres mobile */}
        {showFilters && (
          <div className="lg:hidden mb-4 bg-white rounded-2xl border border-dark-100 shadow-card overflow-hidden animate-fadeIn">
            <div className="bg-primary-700 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-display font-bold text-white flex items-center gap-2">
                <SlidersHorizontal size={15} /> Filtres
              </h2>
              <button onClick={() => setShowFilters(false)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-5">
              <FilterSidebar {...filterProps} />
            </div>
          </div>
        )}

        {/* Badges filtres actifs */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.map(f => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-800 border border-primary-200 px-3 py-1.5 rounded-full text-xs font-semibold"
              >
                {f.label}
                <button
                  onClick={f.clear}
                  className="w-4 h-4 rounded-full bg-primary-200 hover:bg-primary-300 flex items-center justify-center text-primary-700 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {activeFilters.length > 1 && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs text-dark-500 hover:text-guinea-600 px-2.5 py-1.5 rounded-full border border-dark-200 hover:border-guinea-300 transition-colors"
              >
                <RotateCcw size={11} /> Tout effacer
              </button>
            )}
          </div>
        )}

        {/* En-tête résultats + tri */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="bg-primary-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg tabular-nums">
              {total.toLocaleString('fr-FR')}
            </span>
            <span className="text-sm text-dark-500">
              annonce{total !== 1 ? 's' : ''}
              {q && <> pour <span className="text-primary-700 font-semibold">&ldquo;{q}&rdquo;</span></>}
            </span>
            {(hasFilters || q) && (
              <button
                onClick={saveSearch}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Bookmark size={12} /> Sauvegarder
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {SORTS.map(({ v, l, Icon }) => (
              <button
                key={v}
                onClick={() => { setSort(v); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
                  sort === v
                    ? 'bg-primary-700 text-white border-primary-700 shadow-premium'
                    : 'bg-white text-dark-600 border-dark-200 hover:border-primary-400 hover:text-primary-700'
                }`}
              >
                <Icon size={12} /> {l}
              </button>
            ))}
          </div>
        </div>

        {/* Grille */}
        <AnnonceGrid annonces={data?.data} isLoading={isLoading} cols={4} />

        {/* État vide */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-card border border-dark-100">
              <Search size={32} className="text-dark-300" />
            </div>
            <h3 className="text-xl font-display font-bold text-dark-900 mb-2">Aucune annonce trouvée</h3>
            <p className="text-dark-400 text-sm max-w-xs leading-relaxed mb-6">
              {hasFilters
                ? 'Aucune annonce ne correspond à vos critères. Essayez de modifier ou réinitialiser vos filtres.'
                : "Il n'y a pas encore d'annonces dans cette catégorie."}
            </p>
            {hasFilters && (
              <button onClick={handleReset} className="btn-primary flex items-center gap-2 text-sm">
                <RotateCcw size={14} /> Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-10 flex-wrap">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-dark-200 bg-white text-dark-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary-400 hover:text-primary-700 transition-colors shadow-sm"
            >
              ← Précédent
            </button>
            {Array.from({ length: Math.min(data.pagination.pages, 7) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all border shadow-sm ${
                  page === p
                    ? 'bg-primary-700 text-white border-primary-700 shadow-premium'
                    : 'bg-white text-dark-600 border-dark-200 hover:border-primary-400 hover:text-primary-700'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-dark-200 bg-white text-dark-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary-400 hover:text-primary-700 transition-colors shadow-sm"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page wrapper ──────────────────────────────────────────────────── */
export default function AnnoncesListPage() {
  return (
    <div className="min-h-screen bg-dark-50 flex flex-col">
      <PageViewTracker page="ANNONCES" />
      <Navbar />
      <main className="relative isolate overflow-hidden flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <CulturalPattern />
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 bg-primary-700 rounded-2xl flex items-center justify-center shrink-0 shadow-premium">
            <Search size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900 leading-tight">Toutes les annonces</h1>
            <p className="text-dark-400 text-sm">Trouvez ce dont vous avez besoin en Guinée</p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="flex gap-6">
              <div className="hidden lg:block w-64 shrink-0">
                <div className="bg-white rounded-2xl border border-dark-100 shadow-card overflow-hidden">
                  <div className="bg-primary-700 h-12" />
                  <div className="p-5 space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="skeleton h-9 rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-dark-100 overflow-hidden shadow-card">
                    <div className="skeleton aspect-[4/3]" />
                    <div className="p-3 space-y-2">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-5 w-1/2" />
                      <div className="skeleton h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <AnnoncesList />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
