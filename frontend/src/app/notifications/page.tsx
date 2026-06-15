'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  Bell, Check, MessageCircle, Star, Eye, Clock,
  CheckCircle, AlertTriangle, Briefcase,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const NOTIF_CONFIG: Record<string, { icon: any; color: string }> = {
  NEW_MESSAGE:       { icon: MessageCircle, color: 'bg-primary-100 text-primary-700' },
  NEW_RATING:        { icon: Star,          color: 'bg-yellow-100 text-yellow-700'   },
  NEW_VIEW:          { icon: Eye,           color: 'bg-blue-100 text-blue-600'       },
  NEW_APPLICATION:   { icon: Briefcase,     color: 'bg-purple-100 text-purple-700'   },
  ANNONCE_EXPIRED:   { icon: Clock,         color: 'bg-orange-100 text-orange-600'   },
  ANNONCE_APPROVED:  { icon: CheckCircle,   color: 'bg-green-100 text-green-700'     },
  ACCOUNT_SUSPENDED: { icon: AlertTriangle, color: 'bg-red-100 text-red-600'         },
  SYSTEM:            { icon: Bell,          color: 'bg-dark-100 text-dark-500'       },
};

function getNotifLink(notif: any): string | null {
  const data = notif.data as any;
  switch (notif.type) {
    case 'NEW_MESSAGE':
      return data?.conversationId ? `/messages/${data.conversationId}` : '/messages';
    case 'NEW_RATING':
      return '/profil';
    case 'NEW_APPLICATION':
      return '/annonces/lister';
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    api.get('/notifications')
      .then(r => { setNotifications(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isAuthenticated]);

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
  };

  const handleClick = async (notif: any) => {
    if (!notif.isRead) {
      api.put(`/notifications/${notif.id}/read`).catch(() => {});
      setNotifications(ns => ns.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    }
    const link = getNotifLink(notif);
    if (link) router.push(link);
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[70vh] text-center">
        <div>
          <p className="text-6xl mb-4">🔒</p>
          <p className="font-semibold text-dark-700 text-xl mb-4">Connectez-vous pour voir vos notifications</p>
          <Link href="/auth/connexion" className="btn-primary">Se connecter</Link>
        </div>
      </div>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-primary-700 text-sm font-medium mt-0.5">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 border border-primary-200 hover:border-primary-400 hover:bg-primary-50 px-3 py-2 rounded-xl transition-colors"
            >
              <Check size={14} /> Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5 flex gap-3">
                <div className="skeleton w-11 h-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="card p-16 text-center">
            <Bell size={52} className="text-dark-200 mx-auto mb-4" />
            <p className="font-semibold text-dark-700 text-lg mb-1">Aucune notification</p>
            <p className="text-dark-500 text-sm">Vos messages et avis apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const cfg = NOTIF_CONFIG[notif.type] ?? NOTIF_CONFIG.SYSTEM;
              const IconComp = cfg.icon;
              const link = getNotifLink(notif);

              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`card p-4 flex items-start gap-3 transition-all select-none ${
                    !notif.isRead ? 'border-l-4 border-primary-700' : ''
                  } ${link ? 'cursor-pointer hover:shadow-card-hover active:scale-[0.99]' : ''}`}
                >
                  {/* Icône */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <IconComp size={18} />
                  </div>

                  {/* Texte */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-dark-900' : 'font-medium text-dark-700'}`}>
                      {notif.title}
                    </p>
                    <p className="text-dark-500 text-xs mt-0.5 leading-relaxed">{notif.body}</p>
                    <p className="text-dark-400 text-xs mt-1.5">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>

                  {/* Point non-lu */}
                  {!notif.isRead && (
                    <div className="w-2.5 h-2.5 bg-primary-700 rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
