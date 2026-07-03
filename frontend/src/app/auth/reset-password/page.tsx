'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft, ShoppingBag, Lock, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push('/auth/connexion'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    'w-full border border-dark-200 rounded-2xl px-4 py-3.5 text-sm text-dark-900 placeholder-dark-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200';

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

      {/* Panneau droit : formulaire */}
      <main className="flex-1 flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/"><Logo size={64} /></Link>
          </div>

          {!token ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-guinea-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} className="text-guinea-500" />
              </div>
              <h2 className="font-display font-bold text-2xl text-dark-900 mb-3">Lien invalide</h2>
              <p className="text-dark-500 text-sm mb-6 leading-relaxed">
                Ce lien de réinitialisation est incomplet. Refaites une demande depuis la page « Mot de passe oublié ».
              </p>
              <Link
                href="/auth/mot-de-passe-oublie"
                className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline"
              >
                <ArrowLeft size={14} /> Refaire une demande
              </Link>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-primary-600" />
              </div>
              <h2 className="font-display font-bold text-2xl text-dark-900 mb-3">Mot de passe modifié !</h2>
              <p className="text-dark-500 text-sm mb-6 leading-relaxed">
                Vous allez être redirigé vers la page de connexion...
              </p>
              <Link href="/auth/connexion" className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline">
                <ArrowLeft size={14} /> Se connecter maintenant
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                  <Lock size={26} className="text-primary-700" />
                </div>
                <h2 className="font-display font-bold text-3xl text-dark-900">Nouveau mot de passe</h2>
                <p className="text-dark-500 mt-1.5">
                  Choisissez un nouveau mot de passe pour votre compte.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="8 caractères minimum"
                      className={`${fieldCls} pr-12`}
                      required
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

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Confirmez le mot de passe</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le mot de passe"
                    className={fieldCls}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-guinea-600 bg-guinea-50 rounded-xl px-4 py-3">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium disabled:opacity-60 disabled:cursor-not-allowed text-base"
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Modification...</>
                    : 'Réinitialiser le mot de passe'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/connexion"
                  className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-primary-700 transition-colors"
                >
                  <ArrowLeft size={14} /> Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
