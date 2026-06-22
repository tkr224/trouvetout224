'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  Bell, BellOff, Store, Users, Lock, ArrowRight,
  Loader2, UserMinus, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AbonnementsPage() {
  const { isAuthenticated } = useAuthStore();
  const [subs, setSubs]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notifyLoading, setNotifyLoading] = useState<string | null>(null);
  const [unsubLoading, setUnsubLoading]   = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    api.get('/subscriptions')
      .then(r => { setSubs(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isAuthenticated]);

  const handleUnsubscribe = async (vendorId: string) => {
    setUnsubLoading(vendorId);
    try {
      await api.delete(`/subscriptions/${vendorId}`);
      setSubs(s => s.filter(sub => sub.vendorId !== vendorId));
      toast('Désabonné', { icon: '👋' });
    } catch {
      toast.error('Erreur lors du désabonnement');
    } finally {
      setUnsubLoading(null);
    }
  };

  const handleNotifyToggle = async (sub: any) => {
    setNotifyLoading(sub.vendorId);
    try {
      const r = await api.patch(`/subscriptions/${sub.vendorId}/notify`);
      const newNotify = r.data.data.notify;
      setSubs(s => s.map(x => x.vendorId === sub.vendorId ? { ...x, notify: newNotify } : x));
      toast(newNotify ? 'Notifications activées' : 'Notifications désactivées', { icon: newNotify ? '🔔' : '🔕' });
    } catch {
      toast.error('Erreur');
    } finally {
      setNotifyLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh] text-center">
          <div>
            <div className="w-14 h-14 bg-dark-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={26} className="text-dark-400" />
            </div>
            <p className="font-semibold text-dark-700 text-xl mb-4">
              Connectez-vous pour voir vos abonnements
            </p>
            <Link href="/auth/connexion" className="btn-primary">Se connecter</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
            <Users size={22} className="text-primary-700" /> Mes abonnements
          </h1>
          {!loading && (
            <p className="text-dark-400 text-sm mt-1">
              {subs.length} boutique{subs.length > 1 ? 's' : ''} suivie{subs.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Chargement */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 flex gap-3 items-center">
                <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>

        /* Vide */
        ) : subs.length === 0 ? (
          <div className="card p-16 text-center">
            <Store size={52} className="text-dark-200 mx-auto mb-4" />
            <p className="font-semibold text-dark-700 text-lg mb-1">Aucune boutique suivie</p>
            <p className="text-dark-500 text-sm mb-6">
              Abonnez-vous à des boutiques pour ne manquer aucun nouveau produit
            </p>
            <Link href="/annonces/lister" className="btn-primary inline-flex items-center gap-2">
              Découvrir les annonces
            </Link>
          </div>

        /* Liste */
        ) : (
          <div className="space-y-3">
            {subs.map(sub => {
              const vendor   = sub.vendor;
              const shopName = vendor.shopName || `${vendor.firstName} ${vendor.lastName}`;
              const initial  = shopName[0]?.toUpperCase() || '?';
              const count    = vendor._count?.annonces ?? 0;

              return (
                <div
                  key={sub.id}
                  className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow"
                >
                  {/* Logo / initiale */}
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {vendor.shopLogo
                      ? <img src={vendor.shopLogo} alt="" className="w-full h-full object-cover" />
                      : <span className="text-primary-700 font-bold text-lg">{initial}</span>
                    }
                  </div>

                  {/* Infos boutique */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-dark-900 text-sm truncate">{shopName}</p>
                      {vendor.isVerified && (
                        <CheckCircle size={13} className="text-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-dark-400 text-xs mt-0.5">
                      {count} annonce{count > 1 ? 's' : ''} active{count > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">

                    {/* Toggle notifications */}
                    <button
                      onClick={() => handleNotifyToggle(sub)}
                      disabled={notifyLoading === sub.vendorId}
                      title={sub.notify ? 'Désactiver les notifications' : 'Activer les notifications'}
                      className={`p-2 rounded-xl transition-colors ${
                        sub.notify
                          ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                          : 'bg-dark-100 text-dark-400 hover:bg-dark-200'
                      }`}
                    >
                      {notifyLoading === sub.vendorId
                        ? <Loader2 size={14} className="animate-spin" />
                        : sub.notify ? <Bell size={14} /> : <BellOff size={14} />
                      }
                    </button>

                    {/* Voir la boutique */}
                    <Link
                      href={`/profil/${vendor.id}`}
                      className="p-2 rounded-xl bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                      title="Voir la boutique"
                    >
                      <ArrowRight size={14} />
                    </Link>

                    {/* Se désabonner */}
                    <button
                      onClick={() => handleUnsubscribe(sub.vendorId)}
                      disabled={unsubLoading === sub.vendorId}
                      className="p-2 rounded-xl bg-dark-100 text-dark-400 hover:bg-guinea-50 hover:text-guinea-600 transition-colors"
                      title="Se désabonner"
                    >
                      {unsubLoading === sub.vendorId
                        ? <Loader2 size={14} className="animate-spin" />
                        : <UserMinus size={14} />
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
