'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, ShoppingBag, Store, Repeat2, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

type AccountType = 'ACHETEUR' | 'VENDEUR' | 'LES_DEUX';

const ACCOUNT_OPTIONS: Array<{
  type: AccountType; label: string; desc: string; Icon: React.ElementType; accent: string; accBg: string;
}> = [
  { type: 'ACHETEUR', label: 'Acheteur', desc: "Je cherche et j'achète des produits ou services", Icon: ShoppingBag, accent: 'text-sky-600', accBg: 'bg-sky-50' },
  { type: 'VENDEUR', label: 'Vendeur', desc: 'Je vends mes produits ou services en ligne', Icon: Store, accent: 'text-primary-700', accBg: 'bg-primary-50' },
  { type: 'LES_DEUX', label: 'Les deux', desc: "J'achète ET je vends — le profil complet", Icon: Repeat2, accent: 'text-gold-600', accBg: 'bg-gold-50' },
];

export default function ChoisirProfilPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const [accountType, setAccountType] = useState<AccountType>('ACHETEUR');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) router.replace('/auth/connexion');
  }, [_hasHydrated, isAuthenticated, router]);

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/users/me', { accountType });
      if (user) setUser({ ...user, ...data.data, accountType });
      if (accountType === 'ACHETEUR') {
        toast.success('Bienvenue sur TrouveTout224 !');
        router.push('/');
      } else {
        toast.success('Un dernier pas : configurez votre boutique !');
        router.push('/vendeur/boutique');
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (!_hasHydrated || !isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 px-6 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-premium p-8">
        <div className="flex justify-center mb-6">
          <Logo size={56} />
        </div>
        <h2 className="font-display font-bold text-3xl text-dark-900 text-center mb-2">
          Bienvenue {user?.firstName} !
        </h2>
        <p className="text-dark-500 text-sm text-center mb-8">
          Votre compte Google est connecté. Dites-nous qui vous êtes pour finaliser votre profil.
        </p>

        <div className="space-y-3 mb-8">
          {ACCOUNT_OPTIONS.map(({ type, label, desc, Icon, accent, accBg }) => {
            const active = accountType === type;
            return (
              <button key={type} onClick={() => setAccountType(type)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                  active ? 'border-primary-700 bg-primary-50/30' : 'border-dark-200 bg-white hover:border-dark-300'
                }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${active ? accBg : 'bg-dark-100'}`}>
                  <Icon size={24} className={active ? accent : 'text-dark-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-base leading-tight ${active ? 'text-dark-900' : 'text-dark-700'}`}>{label}</p>
                  <p className="text-sm text-dark-500 mt-0.5 leading-snug">{desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  active ? 'border-primary-700 bg-primary-700' : 'border-dark-300 bg-white'
                }`}>
                  {active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={submit} disabled={loading}
          className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium disabled:opacity-60 text-base">
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Enregistrement...</>
            : accountType === 'ACHETEUR'
              ? <><CheckCircle size={18} /> Continuer</>
              : <>Continuer <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}
