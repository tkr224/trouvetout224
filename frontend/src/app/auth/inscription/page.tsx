'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, CheckCircle, MessageCircle, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<any>();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      setUser(res.data.user);
      setTokens(res.data.accessToken, res.data.refreshToken);
      toast.success('Compte créé avec succès ! Bienvenue 🎉');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    'w-full border border-dark-200 rounded-2xl px-4 py-3 text-sm text-dark-900 placeholder-dark-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200';
  const labelCls = 'block text-sm font-semibold text-dark-700 mb-1.5';

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche décoratif — desktop uniquement ─────────── */}
      <aside className="hidden lg:flex w-[420px] flex-shrink-0 sticky top-0 h-screen flex-col items-center justify-center p-10 overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-guinea-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <Link href="/" className="inline-block">
            <Logo size={82} />
          </Link>

          <h1 className="font-display font-bold text-[2.2rem] leading-tight text-white mt-6 mb-2">
            Trouve<span className="text-gold-400">Tout</span><span className="text-guinea-300">224</span>
          </h1>
          <p className="text-primary-100 text-sm mb-10">
            Rejoignez la communauté de Guinée
          </p>

          <div className="space-y-3 text-left">
            {[
              { Icon: CheckCircle, text: 'Publication 100% gratuite, sans limite', iconCls: 'text-primary-300' },
              { Icon: MessageCircle, text: 'Messagerie intégrée avec les vendeurs', iconCls: 'text-gold-300' },
              { Icon: MapPin, text: 'Accès à toute la Guinée, 8 villes couvertes', iconCls: 'text-guinea-300' },
            ].map(({ Icon, text, iconCls }) => (
              <div
                key={text}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3.5"
              >
                <Icon size={20} className={iconCls} />
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

      {/* ── Panneau droit : formulaire ────────────────────────────── */}
      <main className="flex-1 bg-white overflow-y-auto">
        <div className="min-h-full flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-lg">

            {/* Logo — mobile uniquement */}
            <div className="flex justify-center mb-8 lg:hidden">
              <Link href="/">
                <Logo size={64} />
              </Link>
            </div>

            {/* En-tête */}
            <h2 className="font-display font-bold text-3xl text-dark-900">
              Créer un compte 🇬🇳
            </h2>
            <p className="text-dark-500 mt-1.5 mb-8">
              Rejoignez la communauté TrouveTout224 — c'est gratuit !
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Prénom + Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Prénom *</label>
                  <input
                    {...register('firstName', { required: true })}
                    type="text"
                    placeholder="Mamadou"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nom *</label>
                  <input
                    {...register('lastName', { required: true })}
                    type="text"
                    placeholder="Diallo"
                    className={fieldCls}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelCls}>Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="email@exemple.com"
                  className={fieldCls}
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className={labelCls}>Téléphone</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3.5 bg-dark-50 border border-dark-200 rounded-2xl text-sm text-dark-600 whitespace-nowrap font-medium">
                    🇬🇳 +224
                  </span>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="620 00 00 00"
                    className={`${fieldCls} flex-1`}
                  />
                </div>
              </div>

              {/* Date naissance + Sexe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date de naissance</label>
                  <input
                    {...register('dateOfBirth')}
                    type="date"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Sexe</label>
                  <select {...register('gender')} className={fieldCls}>
                    <option value="">Choisir</option>
                    <option value="MALE">Homme</option>
                    <option value="FEMALE">Femme</option>
                  </select>
                </div>
              </div>

              {/* Ville */}
              <div>
                <label className={labelCls}>Ville</label>
                <select {...register('cityId')} className={fieldCls}>
                  <option value="">Sélectionnez votre ville</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Mot de passe */}
              <div>
                <label className={labelCls}>Mot de passe *</label>
                <div className="relative">
                  <input
                    {...register('password', { required: true, minLength: 6 })}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Minimum 6 caractères"
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

              {/* CGU */}
              <div className="flex items-start gap-3 bg-dark-50 rounded-2xl p-4">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 w-4 h-4 accent-primary-700 cursor-pointer flex-shrink-0"
                />
                <p className="text-xs text-dark-500 leading-relaxed">
                  J'accepte les{' '}
                  <Link href="/conditions" className="text-primary-700 hover:underline font-semibold">
                    conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="/confidentialite" className="text-primary-700 hover:underline font-semibold">
                    politique de confidentialité
                  </Link>.{' '}
                  Âge minimum : 13 ans.
                </p>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium disabled:opacity-60 disabled:cursor-not-allowed text-base"
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Création...</>
                  : 'Créer mon compte gratuitement'}
              </button>
            </form>

            {/* Lien connexion */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-dark-100" />
              <span className="text-xs text-dark-400 font-medium">déjà inscrit ?</span>
              <div className="flex-1 h-px bg-dark-100" />
            </div>

            <Link
              href="/auth/connexion"
              className="block w-full text-center border-2 border-primary-700 text-primary-700 font-semibold py-3.5 rounded-2xl hover:bg-primary-50 active:scale-[0.98] transition-all duration-200 text-sm"
            >
              Se connecter →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
