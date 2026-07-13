'use client';
import { useEffect, useState } from 'react';
import { Mail, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// Snooze : ne pas ré-afficher pendant 12h après une fermeture manuelle
const DISMISS_KEY = 'email_verif_dismissed_at';
const SNOOZE_MS = 12 * 60 * 60 * 1000;

export default function EmailVerificationBanner() {
  const { user, setUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !user?.email || user.emailVerified) {
      setVisible(false);
      return;
    }
    const ts = localStorage.getItem(DISMISS_KEY);
    if (ts && Date.now() - parseInt(ts, 10) < SNOOZE_MS) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [_hasHydrated, isAuthenticated, user?.email, user?.emailVerified]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleResend = async () => {
    setSending(true);
    try {
      const res = await api.post('/auth/resend-verification', {});
      toast.success(res.data.message || 'Email envoyé !');
      setCooldown(60);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.alreadyVerified && user) {
        setUser({ ...user, emailVerified: true });
        setVisible(false);
      }
      toast.error(data?.error || "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-gold-50 border-b border-gold-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Mail size={17} className="text-gold-600 dark:text-gold-400 flex-shrink-0" />
        <p className="flex-1 min-w-0 text-sm text-dark-700 dark:text-gray-200 truncate">
          Vérifiez votre email pour sécuriser votre compte.
        </p>
        <button
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gold-600 dark:text-gold-400 hover:underline disabled:opacity-60 disabled:cursor-not-allowed disabled:no-underline whitespace-nowrap"
        >
          {sending
            ? <><Loader2 size={13} className="animate-spin" /> Envoi...</>
            : cooldown > 0
              ? `Réessayer dans ${cooldown}s`
              : "Renvoyer l'email"}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          className="flex-shrink-0 p-1 rounded-full text-gold-600 hover:text-gold-600/80 dark:text-gold-400 dark:hover:text-gold-300 hover:bg-gold-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
