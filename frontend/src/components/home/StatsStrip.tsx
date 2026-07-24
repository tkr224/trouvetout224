'use client';
import { useTranslations } from 'next-intl';
import { LayoutGrid, MapPin, Package, Store } from 'lucide-react';
import AnimatedCounter from '@/components/home/AnimatedCounter';
import { useCategories } from '@/hooks/useCategories';
import { useHomeStats } from '@/hooks/useHomeStats';

export default function StatsStrip() {
  const t = useTranslations('accueil');
  const { data: categories } = useCategories();
  const { data: stats } = useHomeStats();

  return (
    <section className="bg-white dark:bg-dark-900 border-b border-dark-100 dark:border-dark-700 pt-7 pb-5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: LayoutGrid, label: t('stats.categories'), value: stats?.categories ?? categories?.length ?? 0 },
            { icon: MapPin,     label: t('stats.cities'),     value: stats?.cities ?? 8 },
            { icon: Package,    label: t('stats.annonces'),   value: stats?.annonces ?? 0 },
            { icon: Store,      label: t('stats.boutiques'),  value: stats?.boutiques ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1">
              <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-1">
                <Icon size={17} className="text-primary-700 dark:text-primary-400" />
              </div>
              <p className="font-display font-extrabold text-xl sm:text-2xl text-dark-900 dark:text-white leading-none">
                <AnimatedCounter value={value} />
              </p>
              <p className="text-dark-400 text-[11px] sm:text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
