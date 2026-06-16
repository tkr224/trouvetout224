'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, CheckCircle, MessageCircle, ShoppingBag, Lock, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { identifier: identifier.trim() });
      setSent(true);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        setSent(true);
      } else {
        setError(err.response?.data?.error || 'Une erreur est survenue. Contactez le support.');
      }
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
              { Icon: ShoppingBag, text: 'Des milliers d\'annonces partout en Guinée',  cls: 'text-gold-300' },
              { Icon: Lock,        text: 'Compte sécurisé, données protégées',          cls: 'text-primary-300' },
              { Icon: Zap,         text: 'Publiez une annonce en moins de 2 minutes',   cls: 'text-guinea-300' },
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

          {/* Logo mobile */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/"><Logo size={64} /></Link>
          </div>

          {!sent ? (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                  <Mail size={26} className="text-primary-700" />
                </div>
                <h2 className="font-display font-bold text-3xl text-dark-900">Mot de passe oublié ?</h2>
                <p className="text-dark-500 mt-1.5">
                  Entrez votre adresse email ou votre numéro de téléphone. Nous vous enverrons un lien de réinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    Email ou téléphone
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="email@exemple.com ou 620 00 00 00"
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
                    ? <><Loader2 size={18} className="animate-spin" /> Envoi en cours...</>
                    : 'Envoyer le lien'}
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
          ) : (
            /* État succès */
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-primary-600" />
              </div>
              <h2 className="font-display font-bold text-2xl text-dark-900 mb-3">Demande envoyée</h2>
              <p className="text-dark-500 text-sm mb-6 leading-relaxed">
                Si un compte existe avec cet identifiant, vous recevrez un message avec les instructions pour réinitialiser votre mot de passe.
              </p>

              <div className="bg-primary-50 rounded-2xl p-5 mb-6 text-left">
                <p className="text-sm font-semibold text-dark-700 mb-2">Vous n&apos;avez rien reçu ?</p>
                <p className="text-sm text-dark-500 mb-3">
                  Vérifiez vos spams ou contactez notre support directement.
                </p>
                <a
                  href="https://wa.me/224620000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                >
                  <MessageCircle size={15} /> Contacter le support
                </a>
              </div>

              <Link
                href="/auth/connexion"
                className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline"
              >
                <ArrowLeft size={14} /> Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
