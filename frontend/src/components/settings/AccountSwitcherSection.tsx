'use client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore, MAX_ACCOUNTS } from '@/store/auth.store';

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

  const handleRemove = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('removeConfirm'))) return;
    removeAccount(userId);
    toast.success(t('removed'));
    if (userId === user?.id) router.refresh();
  };

  return (
    <div className="mb-5">
      <h3 className="font-semibold text-dark-900 flex items-center gap-2 mb-1">
        <UserCircle2 size={16} className="text-primary-700" /> {t('title')}
      </h3>
      <p className="text-xs text-dark-500 mb-3">{t('hint', { max: MAX_ACCOUNTS })}</p>

      <div className="space-y-2">
        {accounts.map((a) => {
          const isActive = a.user.id === user?.id;
          return (
            <button
              key={a.user.id}
              type="button"
              onClick={() => handleSwitch(a.user.id)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-left transition-colors ${
                isActive ? 'bg-primary-50 border-2 border-primary-600' : 'bg-dark-50 border-2 border-transparent hover:border-dark-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                  {a.user.firstName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-dark-800 truncate">{a.user.firstName} {a.user.lastName}</p>
                  <p className="text-xs text-dark-500 truncate">{a.user.email || a.user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isActive && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-600 text-white">{t('active')}</span>
                )}
                <button
                  onClick={(e) => handleRemove(a.user.id, e)}
                  aria-label={t('removeBtn')}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-dark-400 hover:bg-guinea-50 hover:text-guinea-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </button>
          );
        })}
      </div>

      {accounts.length < MAX_ACCOUNTS ? (
        <Link
          href="/auth/connexion?mode=add"
          className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-700 hover:underline"
        >
          <Plus size={15} /> {t('addBtn')}
        </Link>
      ) : (
        <p className="text-xs text-dark-400 mt-3">{t('limitReached', { max: MAX_ACCOUNTS })}</p>
      )}
    </div>
  );
}
