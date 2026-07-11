'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, ShoppingBag, Lock, Zap, Ban } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import GoogleButton from '@/components/auth/GoogleButton';

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [suspended, setSuspended] = useState<{ reason: string | null } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setTokens } = useAuthStore();
  const { register, handleSubmit } = useForm<any>();

  const onSubmit = async (data: any) => {
    setLoading(true);
    setSuspended(null);
    try {
      const res = await api.post('/auth/login', {
        identifier: data.identifier,
        password: data.password,
      });
      setUser(res.data.user);
      setTokens(res.data.accessToken, res.data.refreshToken);
      toast.success('Connexion réussie !');
      const redirect = searchParams.get('redirect');
      router.push(redirect && redirect.startsWith('/') ? redirect : '/');
    } catch (err: any) {
      const errData = err.response?.data;
      if (err.response?.status === 403 && errData?.suspended) {
        setSuspended({ reason: errData.suspendedReason || null });
      } else {
        toast.error(errData?.error || 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setLoading(true);
    setSuspended(null);
    try {
      const res = await api.post('/auth/oauth', { provider: 'google', token: idToken });
      setUser(res.data.user);
      setTokens(res.data.accessToken, res.data.refreshToken);
      toast.success('Connexion réussie !');
      if (res.data.isNewUser) {
        router.push('/auth/choisir-profil');
      } else {
        const redirect = searchParams.get('redirect');
        router.push(redirect && redirect.startsWith('/') ? redirect : '/');
      }
    } catch (err: any) {
      const errData = err.response?.data;
      if (err.response?.status === 403 && errData?.suspended) {
        setSuspended({ reason: errData.suspendedReason || null });
      } else {
        toast.error(errData?.error || 'Erreur de connexion avec Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    'w-full border border-dark-200 rounded-2xl px-4 py-3.5 text-sm text-dark-900 placeholder-dark-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200';

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche décoratif — desktop uniquement ─────────── */}
      <aside className="hidden lg:flex w-[460px] flex-shrink-0 sticky top-0 h-screen flex-col items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
        {/* Ambiances colorées */}
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
              { Icon: ShoppingBag, text: 'Des milliers d\'annonces partout en Guinée',  cls: 'text-gold-300' },
              { Icon: Lock,        text: 'Compte sécurisé, données protégées',          cls: 'text-primary-300' },
              { Icon: Zap,         text: 'Publiez une annonce en moins de 2 minutes',   cls: 'text-guinea-300' },
            ].map(({ Icon, text, cls }) => (
              <div
                key={text}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3.5"
              >
                <Icon size={20} className={cls} />
                <span className="text-white text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Mini drapeaux décoratifs */}
          <div className="flex items-center justify-center gap-1.5 mt-10">
            <div className="w-6 h-3.5 rounded-sm bg-guinea-500" />
            <div className="w-6 h-3.5 rounded-sm bg-gold-400" />
            <div className="w-6 h-3.5 rounded-sm bg-primary-500" />
          </div>
        </div>
      </aside>

      {/* ── Panneau droit : formulaire ────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md">

          {/* Logo — mobile uniquement */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/">
              <Logo size={64} />
            </Link>
          </div>

          {/* En-tête */}
          <h2 className="font-display font-bold text-3xl text-dark-900">Bon retour !</h2>
          <p className="text-dark-500 mt-1.5 mb-8">Connectez-vous à votre compte</p>

          {suspended && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <Ban size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-red-800 text-sm">Compte suspendu</p>
                {suspended.reason && (
                  <p className="text-red-700 text-xs mt-1">Raison : {suspended.reason}</p>
                )}
                <p className="text-red-500 text-xs mt-1">Contactez le support pour toute réclamation.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Identifiant */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Email ou téléphone
              </label>
              <input
                {...register('identifier', { required: true })}
                type="text"
                placeholder="email@exemple.com ou 620 00 00 00"
                className={fieldCls}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-dark-700">Mot de passe</label>
                <Link
                  href="/auth/mot-de-passe-oublie"
                  className="text-xs text-primary-700 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password', { required: true })}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  className={`${fieldCls} pr-12`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Connexion...</>
                : 'Se connecter'}
            </button>
          </form>

          {/* Séparateur + connexion Google */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-dark-100" />
            <span className="text-xs text-dark-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-dark-100" />
          </div>
          <GoogleButton onCredential={handleGoogleCredential} text="signin_with" />

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-dark-100" />
            <span className="text-xs text-dark-400 font-medium">nouveau sur TrouveTout224 ?</span>
            <div className="flex-1 h-px bg-dark-100" />
          </div>

          {/* Lien inscription */}
          <Link
            href="/auth/inscription"
            className="block w-full text-center border-2 border-primary-700 text-primary-700 font-semibold py-3.5 rounded-2xl hover:bg-primary-50 active:scale-[0.98] transition-all duration-200 text-sm"
          >
            Créer un compte gratuitement →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
