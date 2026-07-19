'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, ArrowLeft, ShoppingBag, Lock, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Logo from '@/components/Logo';

type Status = 'loading' | 'success' | 'error';

function ConfirmerEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { user, setUser, isAuthenticated } = useAuthStore();

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de confirmation incomplet.');
      return;
    }
    api.post('/auth/confirm-email-change', { token })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Votre email a été mis à jour avec succès !');
        if (isAuthenticated && user) {
          setUser({ ...user, emailVerified: true });
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Une erreur est survenue.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex">

      {/* Panneau gauche décoratif — desktop uniquement */}
      <aside className="hidden lg:flex w-[460px] flex-shrink-0 sticky top-0 h-screen flex-col items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-guinea-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-primary-500/25 blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <Link href="/" className="inline-block">
            <Logo size={90} />
          </Link>
          <h1 className="font-display font-bold text-[2.4rem] leading-tight text-white mt-7 mb-2">
            Trouve<span className="text-gold-400">Tout</span><span className="text-guinea-300">224</span>
          </h1>
          <p className="text-primary-100 text-base mb-12">
            Le plus grand marché en ligne de Guinée
          </p>
          <div className="space-y-3 text-left">
            {[
              { Icon: ShoppingBag, text: 'Des milliers d\'annonces partout en Guinée', cls: 'text-gold-300' },
              { Icon: Lock, text: 'Compte sécurisé, données protégées', cls: 'text-primary-300' },
              { Icon: Zap, text: 'Publiez une annonce en moins de 2 minutes', cls: 'text-guinea-300' },
            ].map(({ Icon, text, cls }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3.5">
                <Icon size={20} className={cls} />
                <span className="text-white text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-10">
            <div className="w-6 h-3.5 rounded-sm bg-guinea-500" />
            <div className="w-6 h-3.5 rounded-sm bg-gold-400" />
            <div className="w-6 h-3.5 rounded-sm bg-primary-500" />
          </div>
        </div>
      </aside>

      {/* Panneau droit : statut de confirmation */}
      <main className="flex-1 flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/"><Logo size={64} /></Link>
          </div>

          {status === 'loading' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 size={40} className="text-primary-600 animate-spin" />
              </div>
              <h2 className="font-display font-bold text-2xl text-dark-900 mb-3">Confirmation en cours...</h2>
              <p className="text-dark-500 text-sm">Merci de patienter un instant.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-primary-600" />
              </div>
              <h2 className="font-display font-bold text-2xl text-dark-900 mb-3">✅ Email mis à jour !</h2>
              <p className="text-dark-500 text-sm mb-6 leading-relaxed">{message}</p>
              <Link
                href={isAuthenticated ? '/parametres' : '/auth/connexion'}
                className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 px-6 rounded-2xl transition-all"
              >
                {isAuthenticated ? 'Retour aux paramètres' : 'Se connecter'}
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-guinea-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} className="text-guinea-500" />
              </div>
              <h2 className="font-display font-bold text-2xl text-dark-900 mb-3">❌ Lien invalide</h2>
              <p className="text-dark-500 text-sm mb-6 leading-relaxed">{message}</p>
              <p className="text-dark-400 text-xs mb-6">
                Refaites une demande de changement d&apos;email depuis vos paramètres.
              </p>
              <div className="flex flex-col items-center gap-3">
                <Link
                  href="/parametres"
                  className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 px-6 rounded-2xl transition-all"
                >
                  Aller aux paramètres
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-primary-700 transition-colors"
                >
                  <ArrowLeft size={14} /> Retour à l'accueil
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ConfirmerEmailPage() {
  return (
    <Suspense>
      <ConfirmerEmailContent />
    </Suspense>
  );
}
