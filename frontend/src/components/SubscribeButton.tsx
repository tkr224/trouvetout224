'use client';
import { useState, useEffect } from 'react';
import { Bell, BellOff, UserCheck, UserPlus, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

interface Props {
  vendorId: string;
  className?: string;
}

export default function SubscribeButton({ vendorId, className = '' }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const [isSubscribed, setIsSubscribed]   = useState(false);
  const [notify, setNotify]               = useState(true);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [loading, setLoading]             = useState(true);
  const [subLoading, setSubLoading]       = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const isOwnShop = user?.id === vendorId;

  useEffect(() => {
    if (isOwnShop) { setLoading(false); return; }

    if (isAuthenticated) {
      // Route authentifiée — retourne isSubscribed + notify + count
      api.get(`/subscriptions/status/${vendorId}`)
        .then(r => {
          const d = r.data.data;
          setIsSubscribed(d.isSubscribed);
          setNotify(d.notify);
          setSubscriberCount(d.subscriberCount);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      // Route publique — retourne seulement le count
      api.get(`/subscriptions/count/${vendorId}`)
        .then(r => setSubscriberCount(r.data.subscriberCount))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [vendorId, isAuthenticated, isOwnShop]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour suivre cette boutique');
      return;
    }
    setSubLoading(true);
    try {
      if (isSubscribed) {
        const r = await api.delete(`/subscriptions/${vendorId}`);
        setIsSubscribed(false);
        setSubscriberCount(r.data.subscriberCount);
        toast('Désabonné de la boutique', { icon: '👋' });
      } else {
        const r = await api.post(`/subscriptions/${vendorId}`);
        setIsSubscribed(true);
        setNotify(true);
        setSubscriberCount(r.data.subscriberCount);
        toast.success('Abonné ! Vous recevrez les nouveaux produits.');
      }
    } catch {
      toast.error('Erreur, réessayez');
    } finally {
      setSubLoading(false);
    }
  };

  const handleNotifyToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifyLoading(true);
    try {
      const r = await api.patch(`/subscriptions/${vendorId}/notify`);
      const newNotify = r.data.data.notify;
      setNotify(newNotify);
      toast(newNotify ? 'Notifications activées 🔔' : 'Notifications désactivées 🔕', { icon: newNotify ? '🔔' : '🔕' });
    } catch {
      toast.error('Erreur');
    } finally {
      setNotifyLoading(false);
    }
  };

  // Ne rien afficher si c'est la propre boutique du vendeur
  if (isOwnShop) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Compteur d'abonnés */}
      {subscriberCount !== null && subscriberCount > 0 && (
        <span className="text-dark-500 text-sm font-medium whitespace-nowrap">
          {subscriberCount.toLocaleString('fr-FR')} abonné{subscriberCount > 1 ? 's' : ''}
        </span>
      )}

      {/* Bouton s'abonner / abonné */}
      <button
        onClick={handleSubscribe}
        disabled={subLoading || loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 whitespace-nowrap ${
          isSubscribed
            ? 'bg-primary-100 text-primary-700 border border-primary-200 hover:bg-guinea-50 hover:text-guinea-600 hover:border-guinea-200'
            : 'bg-primary-700 text-white hover:bg-primary-800 shadow-sm'
        }`}
      >
        {subLoading
          ? <Loader2 size={14} className="animate-spin" />
          : isSubscribed
            ? <><UserCheck size={14} /> Abonné</>
            : <><UserPlus size={14} /> S'abonner</>
        }
      </button>

      {/* Cloche : toggle notifications — visible seulement si abonné */}
      {isSubscribed && isAuthenticated && (
        <button
          onClick={handleNotifyToggle}
          disabled={notifyLoading}
          title={notify ? 'Désactiver les notifications de cette boutique' : 'Activer les notifications de cette boutique'}
          className={`p-2 rounded-xl transition-colors disabled:opacity-60 ${
            notify
              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              : 'bg-dark-100 text-dark-400 hover:bg-dark-200'
          }`}
        >
          {notifyLoading
            ? <Loader2 size={14} className="animate-spin" />
            : notify ? <Bell size={14} /> : <BellOff size={14} />
          }
        </button>
      )}
    </div>
  );
}
