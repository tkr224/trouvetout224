import {
  Bell, MessageCircle, Star, Eye, Briefcase, Clock,
  CheckCircle, AlertTriangle, ShoppingBag, Trash2, ShieldAlert, Search, Sparkles, EyeOff,
} from 'lucide-react';

// Source unique pour l'icône/couleur par type de notification ET la page vers
// laquelle elle doit rediriger au clic — partagée entre la page /notifications et le
// toast temps réel (GlobalNotificationToasts) pour ne jamais les faire diverger.
export const NOTIF_CONFIG: Record<string, { icon: any; color: string; toastAccent: string }> = {
  NEW_MESSAGE:        { icon: MessageCircle, color: 'bg-primary-100 text-primary-700', toastAccent: 'primary' },
  NEW_RATING:         { icon: Star,          color: 'bg-yellow-100 text-yellow-700',   toastAccent: 'gold' },
  NEW_VIEW:           { icon: Eye,           color: 'bg-blue-100 text-blue-600',       toastAccent: 'info' },
  NEW_APPLICATION:    { icon: Briefcase,     color: 'bg-purple-100 text-purple-700',   toastAccent: 'info' },
  ANNONCE_EXPIRED:    { icon: Clock,         color: 'bg-orange-100 text-orange-600',   toastAccent: 'gold' },
  ANNONCE_APPROVED:   { icon: CheckCircle,   color: 'bg-green-100 text-green-700',     toastAccent: 'success' },
  ANNONCE_REJECTED:   { icon: AlertTriangle, color: 'bg-guinea-100 text-guinea-700',   toastAccent: 'danger' },
  ANNONCE_DELETED:    { icon: Trash2,        color: 'bg-guinea-100 text-guinea-700',   toastAccent: 'danger' },
  ANNONCE_AI_FLAGGED: { icon: ShieldAlert,   color: 'bg-red-100 text-red-600',         toastAccent: 'danger' },
  ACCOUNT_SUSPENDED:  { icon: AlertTriangle, color: 'bg-red-100 text-red-600',         toastAccent: 'danger' },
  ACCOUNT_DELETED:    { icon: AlertTriangle, color: 'bg-red-100 text-red-600',         toastAccent: 'danger' },
  NEW_VENDOR_PRODUCT: { icon: ShoppingBag,   color: 'bg-primary-100 text-primary-700', toastAccent: 'primary' },
  SYSTEM:             { icon: Bell,          color: 'bg-dark-100 text-dark-500',       toastAccent: 'info' },
  DEMANDE_RESPONSE:   { icon: Search,        color: 'bg-primary-100 text-primary-700', toastAccent: 'primary' },
  RECOMMENDATION:     { icon: Sparkles,      color: 'bg-gold-100 text-gold-700',       toastAccent: 'gold' },
  ANNONCE_AUTO_HIDDEN:{ icon: EyeOff,        color: 'bg-orange-100 text-orange-600',   toastAccent: 'danger' },
};

export function getNotifLink(notif: { type: string; data?: any }): string | null {
  const data = notif.data as any;
  switch (notif.type) {
    case 'NEW_MESSAGE':
      return data?.conversationId ? `/messages/${data.conversationId}` : '/messages';
    case 'NEW_RATING':
      return '/profil';
    case 'NEW_APPLICATION':
      return '/annonces/lister';
    case 'ANNONCE_EXPIRED':
    case 'ANNONCE_APPROVED':
    case 'SYSTEM':
      if (typeof data?.link === 'string' && data.link.startsWith('/')) return data.link;
      if (data?.demandeId) return `/je-cherche/${data.demandeId}`;
      return data?.annonceId ? `/annonces/${data.annonceId}` : null;
    case 'ANNONCE_REJECTED':
      return '/profil';
    case 'ANNONCE_DELETED':
      // L'annonce n'existe déjà plus en base au moment où la notif est créée
      // (supprimée par un admin) — pointer vers l'annonce donnerait une 404.
      return '/profil';
    case 'ANNONCE_AI_FLAGGED':
      // Notif envoyée aux admins uniquement, l'annonce est encore en attente
      // de modération — direction la file de signalements IA, pas l'annonce
      // publique (souvent pas encore visible).
      return '/admin/signalements-ia';
    case 'ACCOUNT_DELETED':
      // Notif au propriétaire d'un compte supprimé par un admin — plus de
      // session valide pour lui à ce moment-là, aucun lien pertinent.
      return null;
    case 'DEMANDE_RESPONSE':
      return data?.demandeId ? `/je-cherche/${data.demandeId}` : '/je-cherche';
    case 'RECOMMENDATION':
      return data?.annonceId ? `/annonces/${data.slug || data.annonceId}` : '/';
    case 'ANNONCE_AUTO_HIDDEN':
      // Admins → file de vérification ; propriétaire → son tableau de bord / sa demande
      if (data?.forAdmin) return '/admin/masquees';
      if (data?.demandeId) return `/je-cherche/${data.demandeId}`;
      return '/vendeur';
    case 'NEW_VENDOR_PRODUCT':
      return data?.annonceId ? `/annonces/${data.annonceId}` : '/abonnements';
    default:
      return null;
  }
}
