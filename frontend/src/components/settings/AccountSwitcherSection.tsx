'use client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore, MAX_ACCOUNTS } from '@/store/auth.store';
import { cloudinaryThumb } from '@/lib/cloudinary';
import { SettingsCard, secondaryBtn } from './SettingsUI';

export default function AccountSwitcherSection() {
  const t = useTranslations('parametres.profil.accounts');
  const router = useRouter();
  const { user, accounts, switchAccount, removeAccount } = useAuthStore();

  const handleSwitch = (userId: string) => {
    if (userId === user?.id) return;
    switchAccount(userId);
    toast.success(t('switched'));
    router.refresh();
  };

  const handleRemove = (userId: string) => {
    if (!window.confirm(t('removeConfirm'))) return;
    removeAccount(userId);
    toast.success(t('removed'));
    if (userId === user?.id) router.refresh();
  };

  return (
    <SettingsCard
      icon={Users}
      title={t('title')}
      description={t('hint', { max: MAX_ACCOUNTS })}
      bodyClassName="divide-y divide-dark-100"
      footer={accounts.length < MAX_ACCOUNTS ? (
        <Link href="/auth/connexion?mode=add" className={secondaryBtn}>
          <Plus size={15} /> {t('addBtn')}
        </Link>
      ) : (
        <p className="text-xs text-dark-400">{t('limitReached', { max: MAX_ACCOUNTS })}</p>
      )}
    >
      {accounts.map((a) => {
        const isActive = a.user.id === user?.id;
        return (
          <div key={a.user.id} className="settings-row group flex items-center gap-2 pr-2 sm:pr-3">
            <button
              type="button"
              onClick={() => handleSwitch(a.user.id)}
              aria-current={isActive ? 'true' : undefined}
              className="flex-1 min-w-0 flex items-center gap-3 pl-4 sm:pl-5 py-2.5 text-left"
            >
              {a.user.avatar ? (
                <img src={cloudinaryThumb(a.user.avatar, 80)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs shrink-0">
                  {a.user.firstName?.[0]?.toUpperCase() || '?'}{a.user.lastName?.[0]?.toUpperCase() || ''}
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium text-dark-900 truncate">{a.user.firstName} {a.user.lastName}</span>
                <span className="block text-xs text-dark-500 truncate">{a.user.email || a.user.phone}</span>
              </span>
              {isActive && <span className="settings-badge shrink-0 ml-auto">{t('active')}</span>}
            </button>
            {/* Croix visible au survol (souris) ; toujours visible sur écran tactile */}
            <button
              type="button"
              onClick={() => handleRemove(a.user.id)}
              aria-label={t('removeBtn')}
              title={t('removeBtn')}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-dark-400 hover:text-guinea-600 hover:bg-guinea-50 transition-opacity [@media(hover:hover)_and_(min-width:1024px)]:opacity-0 [@media(hover:hover)_and_(min-width:1024px)]:group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </SettingsCard>
  );
}
