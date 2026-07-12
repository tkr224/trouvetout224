'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Loader2, Eye, EyeOff, CheckCircle, MessageCircle, MapPin,
  ShoppingBag, Store, Repeat2, ArrowLeft, ArrowRight,
  UploadCloud, Camera, X, Building2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const F = 'w-full border border-dark-200 rounded-2xl px-4 py-3 text-sm text-dark-900 placeholder-dark-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200';
const L = 'block text-sm font-semibold text-dark-700 mb-1.5';

type AccountType = 'ACHETEUR' | 'VENDEUR' | 'LES_DEUX';

type Step1Fields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  cityId: string;
  password: string;
  confirmPassword: string;
  cgu: boolean;
};

const ACCOUNT_OPTIONS: Array<{
  type: AccountType;
  label: string;
  desc: string;
  Icon: React.ElementType;
  accent: string;
  accBg: string;
}> = [
  {
    type: 'ACHETEUR',
    label: 'Acheteur',
    desc: "Je cherche et j'achète des produits ou services",
    Icon: ShoppingBag,
    accent: 'text-sky-600',
    accBg: 'bg-sky-50',
  },
  {
    type: 'VENDEUR',
    label: 'Vendeur',
    desc: 'Je vends mes produits ou services en ligne',
    Icon: Store,
    accent: 'text-primary-700',
    accBg: 'bg-primary-50',
  },
  {
    type: 'LES_DEUX',
    label: 'Les deux',
    desc: "J'achète ET je vends — le profil complet",
    Icon: Repeat2,
    accent: 'text-gold-600',
    accBg: 'bg-gold-50',
  },
];

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<AccountType>('ACHETEUR');
  const [loading, setLoading] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Fields | null>(null);
  const [fieldError, setFieldError] = useState<{ field: 'email' | 'phone'; msg: string } | null>(null);

  const [showPwd, setShowPwd] = useState(false);
  const [showConf, setShowConf] = useState(false);

  // Boutique (étape 3)
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopWa, setShopWa] = useState('');
  const [physical, setPhysical] = useState(false);
  const [shopAddr, setShopAddr] = useState('');
  const [shopHours, setShopHours] = useState('');
  const [selCats, setSelCats] = useState<string[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPrev, setLogoPrev] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPrev, setBannerPrev] = useState('');

  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<Step1Fields>();
  const pwd = watch('password');

  // Scroll to top à chaque changement d'étape
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Charger catégories quand on arrive à l'étape 3
  useEffect(() => {
    if (step === 3) {
      api.get('/categories').then(r => setCats(r.data.data || [])).catch(() => {});
    }
  }, [step]);

  const pickImg = (type: 'logo' | 'banner', file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      if (type === 'logo') { setLogoFile(file); setLogoPrev(url); }
      else { setBannerFile(file); setBannerPrev(url); }
    };
    reader.readAsDataURL(file);
  };

  const toggleCat = (id: string) =>
    setSelCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  // Validation étape 1 → passe à 2
  const goStep2 = handleSubmit(data => {
    if (!data.email?.trim() && !data.phone?.trim()) {
      toast.error('Renseignez au moins votre email ou votre téléphone.');
      return;
    }
    setFieldError(null);
    setStep1Data(data);
    setStep(2);
  });

  // Soumission finale (étape 2 pour Acheteur, étape 3 pour Vendeur/Les deux)
  const submit = async () => {
    if (!step1Data) return;
    setLoading(true);
    try {
      // 1. Créer le compte
      const payload: Record<string, unknown> = {
        firstName: step1Data.firstName,
        lastName: step1Data.lastName,
        password: step1Data.password,
        accountType,
      };
      if (step1Data.email?.trim()) payload.email = step1Data.email.trim();
      if (step1Data.phone?.trim()) payload.phone = `+224${step1Data.phone.replace(/\D/g, '')}`;
      if (step1Data.dateOfBirth) payload.dateOfBirth = step1Data.dateOfBirth;
      if (step1Data.cityId) payload.cityId = step1Data.cityId;

      const { data: { user, accessToken, refreshToken: rt } } = await api.post('/auth/register', payload);
      setTokens(accessToken, rt);

      // 2. Si vendeur : upload images puis créer boutique
      if (accountType !== 'ACHETEUR') {
        const cfg = { headers: { Authorization: `Bearer ${accessToken}` } };
        let logoUrl = '';
        let bannerUrl = '';

        if (logoFile) {
          const fd = new FormData();
          fd.append('image', logoFile);
          logoUrl = (await api.post('/upload/image', fd, cfg)).data.url;
        }
        if (bannerFile) {
          const fd = new FormData();
          fd.append('image', bannerFile);
          bannerUrl = (await api.post('/upload/image', fd, cfg)).data.url;
        }

        await api.put('/users/me/shop', {
          shopName: shopName.trim(),
          shopDescription: shopDesc.trim() || undefined,
          shopLogo: logoUrl || undefined,
          shopBanner: bannerUrl || undefined,
          shopWhatsapp: shopWa.trim() ? `+224${shopWa.replace(/\D/g, '')}` : undefined,
          shopCategories: selCats,
          shopHasPhysical: physical,
          shopAddress: shopAddr.trim() || undefined,
          shopHours: shopHours.trim() || undefined,
          shopActive: true,
        }, cfg);
      }

      setUser(user);
      toast.success('Compte créé avec succès ! Bienvenue sur TrouveTout224 🎉');
      router.push('/');
    } catch (err: any) {
      const d = err.response?.data;
      const msg = d?.error
        ?? (Array.isArray(d?.errors) ? d.errors[0]?.msg : null)
        ?? 'Erreur lors de la création du compte.';
      if (err.response?.status === 409 && d?.field) {
        setFieldError({ field: d.field as 'email' | 'phone', msg });
        setStep(1);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitStep3 = () => {
    if (!shopName.trim()) {
      toast.error('Le nom de la boutique est obligatoire.');
      return;
    }
    submit();
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche décoratif (desktop) ───────────────────── */}
      <aside className="hidden lg:flex w-[420px] flex-shrink-0 sticky top-0 h-screen flex-col items-center justify-center p-10 overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-guinea-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 text-center">
          <Link href="/"><Logo size={82} /></Link>
          <h1 className="font-display font-bold text-[2.2rem] leading-tight text-white mt-6 mb-2">
            Trouve<span className="text-gold-400">Tout</span><span className="text-guinea-300">224</span>
          </h1>
          <p className="text-primary-100 text-sm mb-10">Rejoignez la communauté de Guinée</p>
          <div className="space-y-3 text-left">
            {[
              { Icon: CheckCircle, text: 'Publication 100% gratuite, sans limite', cls: 'text-primary-300' },
              { Icon: MessageCircle, text: 'Messagerie intégrée avec les vendeurs', cls: 'text-gold-300' },
              { Icon: MapPin, text: 'Accès à toute la Guinée, 8 villes couvertes', cls: 'text-guinea-300' },
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

      {/* ── Panneau droit : formulaire ───────────────────────────── */}
      <main className="flex-1 bg-white overflow-y-auto">
        <div className="min-h-full flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-lg">

            {/* Logo mobile */}
            <div className="flex justify-center mb-8 lg:hidden">
              <Link href="/"><Logo size={64} /></Link>
            </div>

            {/* ── Barre de progression ─────────────────────────── */}
            <div className="mb-8">
              <div className="flex items-center mb-3">
                {([1, 2, 3] as const).map((s, i) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className={`
                      w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300
                      ${step > s ? 'bg-primary-700 text-white'
                        : step === s ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                        : 'bg-dark-100 text-dark-400'}
                    `}>
                      {step > s ? '✓' : s}
                    </div>
                    {i < 2 && (
                      <div className={`flex-1 h-1 mx-1 rounded-full transition-all duration-500 ${step > s ? 'bg-primary-700' : 'bg-dark-100'}`} />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-dark-400 font-medium">
                Étape {step}/3 —{' '}
                <span className="text-dark-600">
                  {step === 1 ? 'Informations personnelles' : step === 2 ? 'Type de compte' : 'Votre boutique'}
                </span>
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════
                ÉTAPE 1 — Informations personnelles
            ══════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <>
                <h2 className="font-display font-bold text-3xl text-dark-900 mb-1">Créer un compte 🇬🇳</h2>
                <p className="text-dark-500 text-sm mb-6">
                  Rejoignez la communauté TrouveTout224 — c'est gratuit !
                </p>

                <form onSubmit={goStep2} className="space-y-5">

                  {/* Prénom + Nom */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={L}>Prénom *</label>
                      <input
                        {...register('firstName', { required: 'Prénom obligatoire' })}
                        type="text" placeholder="Mamadou" className={F} />
                      {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className={L}>Nom *</label>
                      <input
                        {...register('lastName', { required: 'Nom obligatoire' })}
                        type="text" placeholder="Diallo" className={F} />
                      {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  {/* Date de naissance */}
                  <div>
                    <label className={L}>Date de naissance</label>
                    <input {...register('dateOfBirth')} type="date" className={F} />
                  </div>

                  {/* Email */}
                  <div>
                    <label className={L}>Email</label>
                    <input
                      {...register('email', {
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' },
                        onChange: () => fieldError?.field === 'email' && setFieldError(null),
                      })}
                      type="email" placeholder="email@exemple.com"
                      className={`${F} ${fieldError?.field === 'email' ? 'border-red-400 ring-2 ring-red-200' : ''}`} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    {fieldError?.field === 'email' && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{fieldError.msg}</p>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className={L}>Téléphone</label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3.5 bg-dark-50 border border-dark-200 rounded-2xl text-sm text-dark-600 whitespace-nowrap font-medium">
                        🇬🇳 +224
                      </span>
                      <input
                        {...register('phone', {
                          onChange: () => fieldError?.field === 'phone' && setFieldError(null),
                        })}
                        type="tel" placeholder="620 00 00 00"
                        className={`${F} flex-1 ${fieldError?.field === 'phone' ? 'border-red-400 ring-2 ring-red-200' : ''}`} />
                    </div>
                    {fieldError?.field === 'phone' && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{fieldError.msg}</p>
                    )}
                    <p className="text-xs text-dark-400 mt-1">Au moins un des deux (email ou téléphone) est requis.</p>
                  </div>

                  {/* Ville */}
                  <div>
                    <label className={L}>Ville</label>
                    <select {...register('cityId')} className={F}>
                      <option value="">Sélectionnez votre ville</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className={L}>Mot de passe *</label>
                    <div className="relative">
                      <input
                        {...register('password', {
                          required: 'Mot de passe obligatoire',
                          minLength: { value: 8, message: '8 caractères minimum' },
                          validate: {
                            hasUpper: v => /[A-Z]/.test(v) || 'Au moins une majuscule requise',
                            hasLower: v => /[a-z]/.test(v) || 'Au moins une minuscule requise',
                            hasDigit: v => /[0-9]/.test(v) || 'Au moins un chiffre requis',
                          },
                        })}
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Minimum 8 caractères"
                        className={`${F} pr-12`} />
                      <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {/* Indicateur de force */}
                    {pwd && (() => {
                      const criteria = [
                        { ok: pwd.length >= 8,    text: '8 caractères' },
                        { ok: /[A-Z]/.test(pwd),  text: 'Majuscule' },
                        { ok: /[a-z]/.test(pwd),  text: 'Minuscule' },
                        { ok: /[0-9]/.test(pwd),  text: 'Chiffre' },
                      ];
                      const score = criteria.filter(c => c.ok).length;
                      const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-primary-500'];
                      const labels = ['Très faible', 'Faible', 'Bon', 'Fort'];
                      const textColors = ['text-red-500', 'text-orange-500', 'text-yellow-600', 'text-primary-700'];
                      return (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[0,1,2,3].map(i => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-dark-200'}`} />
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
                              {criteria.map((c, i) => (
                                <span key={i} className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${c.ok ? 'text-primary-600' : 'text-dark-400'}`}>
                                  <CheckCircle size={10} className={c.ok ? 'text-primary-500' : 'text-dark-300'} /> {c.text}
                                </span>
                              ))}
                            </div>
                            {score > 0 && <span className={`text-xs font-semibold ${textColors[score - 1]}`}>{labels[score - 1]}</span>}
                          </div>
                        </div>
                      );
                    })()}
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                  </div>

                  {/* Confirmation mot de passe */}
                  <div>
                    <label className={L}>Confirmer le mot de passe *</label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword', {
                          required: 'Confirmation obligatoire',
                          validate: v => v === pwd || 'Les mots de passe ne correspondent pas',
                        })}
                        type={showConf ? 'text' : 'password'}
                        placeholder="Répétez votre mot de passe"
                        className={`${F} pr-12`} />
                      <button type="button" tabIndex={-1} onClick={() => setShowConf(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                        {showConf ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                  </div>

                  {/* CGU obligatoires */}
                  <div className="flex items-start gap-3 bg-dark-50 rounded-2xl p-4">
                    <input
                      {...register('cgu', { required: true })}
                      id="cgu"
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 accent-primary-700 cursor-pointer flex-shrink-0" />
                    <label htmlFor="cgu" className="text-xs text-dark-500 leading-relaxed cursor-pointer">
                      J'ai lu et j'accepte les{' '}
                      <Link href="/conditions" target="_blank" className="text-primary-700 hover:underline font-semibold">
                        Conditions d'utilisation
                      </Link>{' '}
                      et les{' '}
                      <Link href="/confidentialite" target="_blank" className="text-primary-700 hover:underline font-semibold">
                        Règles de la communauté
                      </Link>.
                      {' '}Âge minimum : 13 ans.
                    </label>
                  </div>
                  {errors.cgu && (
                    <p className="text-xs text-red-500">Vous devez accepter les conditions pour continuer.</p>
                  )}

                  <button type="submit"
                    className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium text-base">
                    Continuer <ArrowRight size={18} />
                  </button>
                </form>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-dark-100" />
                  <span className="text-xs text-dark-400 font-medium">déjà inscrit ?</span>
                  <div className="flex-1 h-px bg-dark-100" />
                </div>
                <Link href="/auth/connexion"
                  className="block w-full text-center border-2 border-primary-700 text-primary-700 font-semibold py-3.5 rounded-2xl hover:bg-primary-50 active:scale-[0.98] transition-all text-sm">
                  Se connecter →
                </Link>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════
                ÉTAPE 2 — Type de compte
            ══════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <>
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-dark-400 hover:text-dark-700 text-sm font-medium mb-6 transition-colors">
                  <ArrowLeft size={15} /> Retour
                </button>

                <h2 className="font-display font-bold text-3xl text-dark-900 mb-2">Je suis...</h2>
                <p className="text-dark-500 text-sm mb-8">
                  Choisissez le profil qui vous correspond. Vous pourrez le modifier depuis votre profil.
                </p>

                <div className="space-y-3 mb-8">
                  {ACCOUNT_OPTIONS.map(({ type, label, desc, Icon, accent, accBg }) => {
                    const active = accountType === type;
                    return (
                      <button key={type} onClick={() => setAccountType(type)}
                        className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                          active ? 'border-primary-700 bg-primary-50/30' : 'border-dark-200 bg-white hover:border-dark-300'
                        }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${active ? accBg : 'bg-dark-100'}`}>
                          <Icon size={24} className={active ? accent : 'text-dark-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-base leading-tight ${active ? 'text-dark-900' : 'text-dark-700'}`}>{label}</p>
                          <p className="text-sm text-dark-500 mt-0.5 leading-snug">{desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          active ? 'border-primary-700 bg-primary-700' : 'border-dark-300 bg-white'
                        }`}>
                          {active && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {accountType !== 'ACHETEUR' && (
                  <div className="flex items-center gap-2.5 bg-gold-50 border border-gold-200 rounded-2xl p-3.5 mb-6">
                    <Store size={16} className="text-gold-600 shrink-0" />
                    <p className="text-sm text-gold-700">
                      À l'étape suivante, vous configurerez votre boutique.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (accountType === 'ACHETEUR') {
                      submit();
                    } else {
                      setStep(3);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium disabled:opacity-60 text-base">
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Création du compte...</>
                    : accountType === 'ACHETEUR'
                      ? <><CheckCircle size={18} /> Créer mon compte</>
                      : <>Créer ma boutique <ArrowRight size={18} /></>
                  }
                </button>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════
                ÉTAPE 3 — Configuration de la boutique
            ══════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <>
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 text-dark-400 hover:text-dark-700 text-sm font-medium mb-6 transition-colors">
                  <ArrowLeft size={15} /> Retour
                </button>

                <h2 className="font-display font-bold text-3xl text-dark-900 mb-2">Votre boutique 🏪</h2>
                <p className="text-dark-500 text-sm mb-8">
                  Créez votre espace de vente. Ces informations seront visibles par tous les acheteurs.
                </p>

                <div className="space-y-6">

                  {/* Nom de la boutique */}
                  <div>
                    <label className={L}>Nom de la boutique *</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      placeholder="Ex: Fashion Conakry, Boutique Diallo..."
                      className={F} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className={L}>Description <span className="text-dark-400 font-normal">(optionnel)</span></label>
                    <textarea
                      value={shopDesc}
                      onChange={e => setShopDesc(e.target.value)}
                      placeholder="Décrivez vos produits ou services, votre spécialité..."
                      rows={3}
                      className={`${F} resize-none`} />
                  </div>

                  {/* Logo */}
                  <div>
                    <label className={L}>Logo / Photo de profil <span className="text-dark-400 font-normal">(optionnel)</span></label>
                    <input
                      ref={logoRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) pickImg('logo', f); }} />
                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => logoRef.current?.click()}
                        className="w-24 h-24 rounded-2xl border-2 border-dashed border-dark-200 hover:border-primary-400 cursor-pointer overflow-hidden flex items-center justify-center bg-dark-50 transition-colors shrink-0">
                        {logoPrev
                          ? <img src={logoPrev} alt="logo" className="w-full h-full object-cover" />
                          : <Camera size={28} className="text-dark-300" />}
                      </div>
                      <div>
                        <button type="button" onClick={() => logoRef.current?.click()}
                          className="flex items-center gap-1.5 text-sm text-primary-700 font-semibold hover:text-primary-800 transition-colors">
                          <UploadCloud size={15} />
                          {logoFile ? 'Changer le logo' : 'Choisir un logo'}
                        </button>
                        {logoFile && (
                          <button type="button" onClick={() => { setLogoFile(null); setLogoPrev(''); }}
                            className="flex items-center gap-1 text-xs text-red-500 mt-1 hover:text-red-700 transition-colors">
                            <X size={11} /> Retirer
                          </button>
                        )}
                        <p className="text-xs text-dark-400 mt-1.5">Format carré recommandé. Max 10 Mo.</p>
                      </div>
                    </div>
                  </div>

                  {/* Bannière */}
                  <div>
                    <label className={L}>Bannière de la boutique <span className="text-dark-400 font-normal">(optionnel)</span></label>
                    <input
                      ref={bannerRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) pickImg('banner', f); }} />
                    <div
                      onClick={() => bannerRef.current?.click()}
                      className="w-full h-32 rounded-2xl border-2 border-dashed border-dark-200 hover:border-primary-400 cursor-pointer overflow-hidden flex items-center justify-center bg-dark-50 transition-colors">
                      {bannerPrev
                        ? <img src={bannerPrev} alt="bannière" className="w-full h-full object-cover" />
                        : (
                          <div className="flex flex-col items-center gap-1.5 text-dark-300 pointer-events-none">
                            <UploadCloud size={28} />
                            <span className="text-xs">Cliquez pour ajouter une bannière</span>
                          </div>
                        )}
                    </div>
                    {bannerFile && (
                      <button type="button" onClick={() => { setBannerFile(null); setBannerPrev(''); }}
                        className="flex items-center gap-1 text-xs text-red-500 mt-1 hover:text-red-700 transition-colors">
                        <X size={11} /> Retirer la bannière
                      </button>
                    )}
                  </div>

                  {/* Catégories de vente */}
                  <div>
                    <label className={L}>Catégories de vente <span className="text-dark-400 font-normal">(optionnel)</span></label>
                    <p className="text-xs text-dark-400 mb-3">
                      Sélectionnez les catégories dans lesquelles vous vendez — plusieurs choix possibles.
                    </p>
                    {cats.length === 0
                      ? <p className="text-xs text-dark-400 italic">Chargement des catégories...</p>
                      : (
                        <div className="flex flex-wrap gap-2">
                          {cats.map(cat => {
                            const active = selCats.includes(cat.id);
                            return (
                              <button key={cat.id} type="button" onClick={() => toggleCat(cat.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                                  active
                                    ? 'bg-primary-700 text-white border-primary-700'
                                    : 'bg-white text-dark-600 border-dark-200 hover:border-primary-400'
                                }`}>
                                <span>{cat.icon}</span>
                                {cat.nameFr || cat.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </div>

                  {/* Boutique physique */}
                  <div>
                    <label className={L}>Avez-vous une boutique physique ?</label>
                    <div className="flex gap-3">
                      {([{ label: 'Oui', val: true }, { label: 'Non', val: false }] as const).map(({ label, val }) => (
                        <button key={String(val)} type="button" onClick={() => setPhysical(val)}
                          className={`flex-1 py-3 rounded-2xl font-semibold text-sm border-2 transition-all ${
                            physical === val
                              ? 'border-primary-700 bg-primary-50 text-primary-700'
                              : 'border-dark-200 bg-white text-dark-500 hover:border-dark-300'
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Adresse + Horaires (si boutique physique) */}
                  {physical && (
                    <div className="bg-dark-50 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-dark-700">
                        <Building2 size={15} /> Informations de la boutique physique
                      </div>
                      <div>
                        <label className={L}>Adresse</label>
                        <input
                          type="text"
                          value={shopAddr}
                          onChange={e => setShopAddr(e.target.value)}
                          placeholder="Quartier Ratoma, Conakry..."
                          className={F} />
                      </div>
                      <div>
                        <label className={L}>Horaires d'ouverture</label>
                        <input
                          type="text"
                          value={shopHours}
                          onChange={e => setShopHours(e.target.value)}
                          placeholder="Lun–Sam : 8h–20h, Dim : fermé"
                          className={F} />
                      </div>
                    </div>
                  )}

                  {/* WhatsApp boutique */}
                  <div>
                    <label className={L}>
                      WhatsApp de la boutique <span className="text-dark-400 font-normal">(optionnel)</span>
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3.5 bg-dark-50 border border-dark-200 rounded-2xl text-sm text-dark-600 whitespace-nowrap font-medium">
                        🇬🇳 +224
                      </span>
                      <input
                        type="tel"
                        value={shopWa}
                        onChange={e => setShopWa(e.target.value)}
                        placeholder="620 00 00 00"
                        className={`${F} flex-1`} />
                    </div>
                  </div>

                  {/* Bouton de création */}
                  <button
                    onClick={submitStep3}
                    disabled={loading}
                    className="w-full bg-primary-700 hover:bg-primary-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-premium disabled:opacity-60 text-base">
                    {loading
                      ? <><Loader2 size={18} className="animate-spin" /> Création en cours...</>
                      : <><CheckCircle size={18} /> Créer mon compte et ma boutique</>
                    }
                  </button>

                  <p className="text-xs text-dark-400 text-center pb-2">
                    Vous pourrez modifier ces informations à tout moment depuis votre profil.
                  </p>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
