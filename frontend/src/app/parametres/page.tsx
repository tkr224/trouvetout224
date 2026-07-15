'use client';
import { useState, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  User, Lock, Bell, Shield, Globe, HelpCircle, FileText, Info, LogOut,
  Settings, CheckCircle, ArrowRight, Mail, CreditCard, ShieldCheck, Link2,
  Palette, Sun, Moon, Monitor, Eye, EyeOff, Loader2, KeyRound,
  Camera, AtSign, XCircle, Phone,
} from 'lucide-react';
import { useTheme, COLOR_THEMES, SPECIAL_THEMES } from '@/components/providers/ThemeProvider';
import Link from 'next/link';

const TABS = [
  { key: 'profil',          label: 'Profil',                    icon: User },
  { key: 'securite',        label: 'Sécurité & Mot de passe',  icon: Lock },
  { key: 'notifications',   label: 'Notifications',             icon: Bell },
  { key: 'confidentialite', label: 'Confidentialité',           icon: Shield },
  { key: 'apparence',       label: 'Apparence',                 icon: Palette },
  { key: 'langue',          label: 'Langue',                    icon: Globe },
  { key: 'aide',            label: 'Aide & Support',            icon: HelpCircle },
  { key: 'conditions',      label: "Conditions d'utilisation",  icon: FileText },
  { key: 'apropos',         label: 'À propos',                  icon: Info },
];

// Regroupement visuel de la sidebar (desktop) — ne change ni les clés ni la logique des onglets
const TAB_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Compte',        keys: ['profil', 'securite', 'confidentialite', 'notifications'] },
  { label: 'Préférences',   keys: ['apparence', 'langue'] },
  { label: 'Support & infos', keys: ['aide', 'conditions', 'apropos'] },
];

const HELP_ITEMS = [
  { Icon: HelpCircle, text: 'Comment publier une annonce ?',   href: '/aide/publier' },
  { Icon: Shield,     text: 'Comment signaler un problème ?',  href: '/aide/signalement' },
  { Icon: Mail,       text: 'Contacter le support',            href: '/contact' },
  { Icon: Link2,      text: 'Centre d\'aide complet',          href: '/aide' },
];

const LANGS = [
  { code: 'fr', label: 'Français',  badge: 'FR', note: 'Actuelle' },
  { code: 'en', label: 'English',   badge: 'EN', note: '' },
  { code: 'ar', label: 'العربية',   badge: 'AR', note: '' },
];

const PROTECTED_TABS = ['profil', 'securite', 'notifications', 'confidentialite'];

export default function ParametresPage() {
  const { user, logout, isAuthenticated, _hasHydrated, setUser } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;
  const { theme, setTheme, colorAccent, setColorAccent, specialTheme, setSpecialTheme, isThemeLocked } = useTheme();
  const [tab, setTab] = useState('profil');

  // Si l'utilisateur non connecté arrive sur un onglet protégé, rediriger vers Apparence
  useEffect(() => {
    if (_hasHydrated && !loggedIn && PROTECTED_TABS.includes(tab)) {
      setTab('apparence');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, loggedIn]);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName]   = useState(user?.lastName || '');
  const [bio, setBio]             = useState('');
  const [username, setUsername]   = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'>('idle');
  const [cityId, setCityId]       = useState('');
  const [cities, setCities]       = useState<{ id: string; name: string }[]>([]);
  const [meData, setMeData]       = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwdFields, setShowPwdFields] = useState(false);
  const [pwdLoading, setPwdLoading]   = useState(false);
  const [pwdError, setPwdError]       = useState('');
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  // Questions de sécurité
  const [sqMaster, setSqMaster]         = useState<{ id: string; label: string }[]>([]);
  const [sqConfigured, setSqConfigured] = useState<{ questionId: string; label: string }[] | null>(null);
  const [sqEditing, setSqEditing]       = useState(false);
  const [sqRows, setSqRows]             = useState<{ questionId: string; answer: string }[]>([
    { questionId: '', answer: '' }, { questionId: '', answer: '' },
  ]);
  const [sqSaving, setSqSaving]         = useState(false);
  const [sqError, setSqError]           = useState('');
  const [notifMsg, setNotifMsg]         = useState(true);
  const [notifAnnonce, setNotifAnnonce] = useState(true);
  const [notifVue, setNotifVue]         = useState(false);
  const [privPublic, setPrivPublic]     = useState(true);
  const [privPhone, setPrivPhone]       = useState(true);
  const [privMessages, setPrivMessages] = useState(true);
  const showGate = PROTECTED_TABS.includes(tab) && _hasHydrated && !loggedIn;

  useEffect(() => {
    const saved = localStorage.getItem('tt224-privacy');
    if (!saved) return;
    try {
      const p = JSON.parse(saved);
      setPrivPublic(p.profPublic ?? true);
      setPrivPhone(p.showPhone ?? true);
      setPrivMessages(p.acceptMessages ?? true);
    } catch {}
  }, []);

  // Charge le profil complet (bio, username, ville, hasPassword — absents du store d'auth léger)
  useEffect(() => {
    if (!loggedIn) return;
    api.get('/users/me').then(r => {
      const d = r.data.data;
      setMeData(d);
      setHasPassword(!!d.hasPassword);
      setFirstName(d.firstName || '');
      setLastName(d.lastName || '');
      setBio(d.bio || '');
      setUsername(d.username || '');
      setCityId(d.cityId || '');
    }).catch(() => {});
  }, [loggedIn]);

  // Liste des villes pour le sélecteur (route publique, déjà utilisée ailleurs dans l'app)
  useEffect(() => {
    api.get('/cities').then(r => setCities(r.data.data || [])).catch(() => {});
  }, []);

  // Questions de sécurité : liste prédéfinie + celles déjà configurées par l'utilisateur
  useEffect(() => {
    if (!loggedIn) return;
    api.get('/auth/security-questions').then(r => setSqMaster(r.data.data || [])).catch(() => {});
    api.get('/users/me/security-questions').then(r => setSqConfigured(r.data.data || [])).catch(() => setSqConfigured([]));
  }, [loggedIn]);

  const startEditSq = () => {
    setSqError('');
    setSqRows(
      sqConfigured && sqConfigured.length >= 2
        ? sqConfigured.map(q => ({ questionId: q.questionId, answer: '' }))
        : [{ questionId: '', answer: '' }, { questionId: '', answer: '' }]
    );
    setSqEditing(true);
  };

  const updateSqRow = (i: number, field: 'questionId' | 'answer', value: string) => {
    setSqRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const addSqRow = () => setSqRows(rows => rows.length < 3 ? [...rows, { questionId: '', answer: '' }] : rows);
  const removeSqRow = (i: number) => setSqRows(rows => rows.length > 2 ? rows.filter((_, idx) => idx !== i) : rows);

  const saveSq = async () => {
    setSqError('');
    if (sqRows.some(r => !r.questionId)) return setSqError('Choisissez une question pour chaque ligne.');
    if (sqRows.some(r => r.answer.trim().length < 2)) return setSqError('Chaque réponse doit contenir au moins 2 caractères.');
    const ids = sqRows.map(r => r.questionId);
    if (new Set(ids).size !== ids.length) return setSqError('Choisissez des questions différentes les unes des autres.');

    setSqSaving(true);
    try {
      await api.put('/users/me/security-questions', { questions: sqRows });
      setSqConfigured(sqRows.map(r => ({ questionId: r.questionId, label: sqMaster.find(q => q.id === r.questionId)?.label || r.questionId })));
      setSqEditing(false);
      toast.success('Questions de sécurité enregistrées !');
    } catch (e: any) {
      setSqError(e.response?.data?.error || "Erreur lors de l'enregistrement.");
    } finally {
      setSqSaving(false);
    }
  };

  // Vérification en direct de la disponibilité du nom d'utilisateur (debounce 450ms)
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) { setUsernameStatus('idle'); return; }
    if (meData?.username && trimmed === meData.username.toLowerCase()) { setUsernameStatus('unchanged'); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(() => {
      api.get('/users/username-available', { params: { username: trimmed } })
        .then(r => setUsernameStatus(r.data.available ? 'available' : 'taken'))
        .catch(() => setUsernameStatus('idle'));
    }, 450);
    return () => clearTimeout(t);
  }, [username, meData]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.url;
      await api.put('/users/me', { avatar: url });
      setLocalAvatar(`${url}?t=${Date.now()}`);
      if (user) setUser({ ...user, avatar: url });
      toast.success('Photo de profil mise à jour !');
    } catch { toast.error("Erreur lors de l'upload de la photo."); }
    finally { setAvatarUploading(false); }
  };

  const PWD_CRITERIA = [
    { ok: (p: string) => p.length >= 8,   text: '8 caractères minimum' },
    { ok: (p: string) => /[A-Z]/.test(p), text: 'Une majuscule' },
    { ok: (p: string) => /[a-z]/.test(p), text: 'Une minuscule' },
    { ok: (p: string) => /[0-9]/.test(p), text: 'Un chiffre' },
  ];
  const pwdCriteriaState = PWD_CRITERIA.map(c => ({ ...c, met: c.ok(newPwd) }));
  const pwdScore = pwdCriteriaState.filter(c => c.met).length;

  const saveProfile = async () => {
    if (usernameStatus === 'taken') return toast.error("Ce nom d'utilisateur est déjà pris.");
    if (usernameStatus === 'invalid') return toast.error("Nom d'utilisateur invalide (3 à 20 caractères : lettres, chiffres, _).");
    if (usernameStatus === 'checking') return toast.error("Vérification du nom d'utilisateur en cours, patientez...");

    setProfileLoading(true);
    try {
      const payload: Record<string, unknown> = { firstName, lastName, bio, cityId: cityId || undefined };
      if (username.trim() && usernameStatus !== 'unchanged') payload.username = username.trim().toLowerCase();

      const { data } = await api.put('/users/me', payload);
      setMeData(data.data);
      if (user) setUser({ ...user, firstName, lastName });
      toast.success('Profil mis à jour !');
    } catch (e: any) {
      const d = e.response?.data;
      if (d?.field === 'username') setUsernameStatus('taken');
      toast.error(d?.error || 'Erreur de mise à jour');
    } finally {
      setProfileLoading(false);
    }
  };

  const savePrivacy = (key: string, val: boolean) => {
    const saved = localStorage.getItem('tt224-privacy');
    const current = saved ? JSON.parse(saved) : {};
    localStorage.setItem('tt224-privacy', JSON.stringify({ ...current, [key]: val }));
  };

  const changePwd = async () => {
    setPwdError('');

    if (hasPassword && !currentPwd) {
      setPwdError('Saisissez votre mot de passe actuel.');
      return;
    }
    if (!newPwd || !confirmPwd) {
      setPwdError('Remplissez tous les champs du nouveau mot de passe.');
      return;
    }
    if (pwdScore < PWD_CRITERIA.length) {
      setPwdError('Le nouveau mot de passe ne respecte pas encore toutes les règles ci-dessous.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (hasPassword && newPwd === currentPwd) {
      setPwdError("Le nouveau mot de passe doit être différent de l'actuel.");
      return;
    }

    setPwdLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: hasPassword ? currentPwd : undefined,
        newPassword: newPwd,
      });
      toast.success(hasPassword ? 'Mot de passe modifié !' : 'Mot de passe défini avec succès !');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setHasPassword(true);
    } catch (e: any) {
      const d = e.response?.data;
      setPwdError(d?.error || (Array.isArray(d?.errors) ? d.errors[0]?.msg : null) || 'Erreur lors du changement de mot de passe.');
    } finally {
      setPwdLoading(false);
    }
  };

  // Purement visuel — le clic est géré par la ligne entière qui l'entoure (cible tactile ≥ 44px)
  const Toggle = ({ value }: { value: boolean }) => (
    <span aria-hidden className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-primary-700' : 'bg-dark-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </span>
  );

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* ══ EN-TÊTE ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-8 sm:py-10"
        style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 55%, rgb(var(--p-900)) 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-5xl mx-auto px-4" style={{ zIndex: 2 }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Settings size={20} className="text-gold-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>Paramètres</h1>
              <p className="text-white/75 text-xs sm:text-sm">Gérez votre profil, votre sécurité et vos préférences</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar navigation — barre d'onglets défilante sur mobile, colonne verticale sur desktop */}
          <div className="bg-white rounded-2xl border border-dark-100 shadow-card h-fit overflow-hidden">

            {/* Mobile : onglets en ligne défilante horizontalement, cibles tactiles ≥ 44px */}
            <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-3 py-3 snap-x">
              {TABS.map(t => {
                const isProtected = PROTECTED_TABS.includes(t.key);
                return (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold whitespace-nowrap transition-colors snap-start
                      ${tab === t.key ? 'bg-primary-700 text-white shadow-sm' : 'bg-dark-50 text-dark-600'}`}>
                    <t.icon size={15} className="shrink-0" />
                    {t.label}
                    {isProtected && !loggedIn && (
                      <Lock size={10} className="shrink-0 opacity-50" />
                    )}
                  </button>
                );
              })}
              {loggedIn ? (
                <button onClick={logout}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold text-red-600 bg-red-50 whitespace-nowrap snap-start">
                  <LogOut size={15} className="shrink-0" /> Déconnexion
                </button>
              ) : (
                <Link href="/auth/connexion"
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold text-primary-700 bg-primary-50 whitespace-nowrap snap-start">
                  <User size={15} className="shrink-0" /> Se connecter
                </Link>
              )}
            </div>

            {/* Desktop : colonne verticale groupée en sections claires */}
            <div className="hidden lg:block p-3 space-y-4">
              {TAB_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="px-3 mb-1.5 text-[11px] font-bold text-dark-400 uppercase tracking-wider">{group.label}</p>
                  <div className="space-y-0.5">
                    {TABS.filter(t => group.keys.includes(t.key)).map(t => {
                      const isProtected = PROTECTED_TABS.includes(t.key);
                      return (
                        <button key={t.key} onClick={() => setTab(t.key)}
                          className={`w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors
                            ${tab === t.key ? 'bg-primary-700 text-white shadow-sm' : 'text-dark-600 hover:bg-dark-50'}`}>
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tab === t.key ? 'bg-white/20' : 'bg-primary-50'}`}>
                            <t.icon size={14} className={tab === t.key ? 'text-white' : 'text-primary-700'} />
                          </span>
                          <span className="flex-1 text-left">{t.label}</span>
                          {isProtected && !loggedIn && (
                            <Lock size={11} className="shrink-0 opacity-40" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-dark-100">
                {loggedIn ? (
                  <button onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={15} className="shrink-0" /> Déconnexion
                  </button>
                ) : (
                  <Link href="/auth/connexion"
                    className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors">
                    <User size={15} className="shrink-0" /> Se connecter
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-dark-100 shadow-card p-4 sm:p-6">

            {/* Gate : onglets protégés sans compte */}
            {showGate ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                  <Lock size={26} className="text-primary-700" />
                </div>
                <h3 className="font-bold text-dark-900 text-lg mb-2">Connexion requise</h3>
                <p className="text-dark-500 text-sm mb-6 max-w-xs leading-relaxed">
                  Ce réglage est lié à votre compte. Connectez-vous pour y accéder.
                </p>
                <div className="flex gap-3 flex-wrap justify-center">
                  <Link href="/auth/connexion" className="btn-primary">Se connecter</Link>
                  <Link href="/auth/inscription" className="btn-outline">Créer un compte</Link>
                </div>
                <p className="text-dark-400 text-xs mt-5">
                  Le réglage <strong>Apparence</strong> (thème clair/sombre) est accessible sans compte.
                </p>
              </div>
            ) : null}

            {!showGate && tab === 'profil' && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-1">Modifier le profil</h2>

                {/* Photo de profil — bien visible en haut */}
                <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-2xl">
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-2xl overflow-hidden shadow-sm">
                      {avatarUploading
                        ? <Loader2 size={24} className="animate-spin text-primary-700" />
                        : (localAvatar || meData?.avatar)
                          ? <img src={localAvatar || meData.avatar} alt="" className="w-full h-full object-cover" />
                          : `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-2xl transition-all flex items-center justify-center">
                      <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900">{user?.firstName} {user?.lastName}</p>
                    {meData?.username && <p className="text-dark-400 text-xs mt-0.5">@{meData.username}</p>}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-primary-700 text-sm hover:underline mt-1.5 inline-flex items-center gap-1.5"
                    >
                      <Camera size={13} /> Changer la photo de profil
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Prénom</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Nom</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} className="input" />
                  </div>
                </div>

                {/* Nom d'utilisateur — pseudo unique */}
                <div>
                  <label className="text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                    <AtSign size={13} className="text-primary-700" /> Nom d&apos;utilisateur
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-sm font-semibold pointer-events-none">@</span>
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="pseudo"
                      className="input pl-8 pr-9"
                      maxLength={20}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && <Loader2 size={15} className="animate-spin text-dark-400" />}
                      {usernameStatus === 'available' && <CheckCircle size={15} className="text-primary-600" />}
                      {usernameStatus === 'taken' && <XCircle size={15} className="text-guinea-500" />}
                    </span>
                  </div>
                  {usernameStatus === 'taken' && <p className="text-xs text-guinea-600 mt-1.5">Ce nom d&apos;utilisateur est déjà pris.</p>}
                  {usernameStatus === 'invalid' && <p className="text-xs text-guinea-600 mt-1.5">3 à 20 caractères : lettres minuscules, chiffres, _ uniquement.</p>}
                  {usernameStatus === 'available' && <p className="text-xs text-primary-600 mt-1.5">Disponible !</p>}
                  {usernameStatus === 'idle' && <p className="text-xs text-dark-400 mt-1.5">Optionnel — votre identifiant unique sur TrouveTout224.</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    placeholder="Parlez de vous en quelques mots..." className="input resize-none" />
                </div>

                {/* Infos existantes : email, téléphone (non modifiables ici), ville */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                      <Mail size={13} className="text-dark-400" /> Email
                    </label>
                    <input
                      value={meData?.email || 'Non renseigné'}
                      disabled
                      className="input bg-dark-50 text-dark-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                      <Phone size={13} className="text-dark-400" /> Téléphone
                    </label>
                    <input
                      value={meData?.phone || 'Non renseigné'}
                      disabled
                      className="input bg-dark-50 text-dark-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Ville</label>
                  <select value={cityId} onChange={e => setCityId(e.target.value)} className="input">
                    <option value="">Non renseignée</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <button onClick={saveProfile} disabled={profileLoading} className="btn-primary px-8 flex items-center gap-2 disabled:opacity-60">
                  {profileLoading && <Loader2 size={15} className="animate-spin" />}
                  Sauvegarder les modifications
                </button>
              </div>
            )}

            {!showGate && tab === 'securite' && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Sécurité du compte</h2>
                <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border border-primary-200 mb-4">
                  <ShieldCheck size={18} className="text-primary-700 shrink-0" />
                  <p className="text-primary-800 text-sm font-medium">Compte actif et sécurisé</p>
                </div>

                {hasPassword === null ? (
                  <p className="text-dark-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement...</p>
                ) : (
                  <>
                    <h3 className="font-semibold text-dark-900 flex items-center gap-2">
                      <KeyRound size={16} className="text-primary-700" />
                      {hasPassword ? 'Changer le mot de passe' : 'Définir un mot de passe'}
                    </h3>

                    {!hasPassword && (
                      <p className="text-dark-500 text-sm bg-dark-50 rounded-2xl p-4">
                        Votre compte a été créé avec Google, vous n&apos;avez pas encore de mot de passe.
                        Définissez-en un ci-dessous pour pouvoir aussi vous connecter avec votre email.
                      </p>
                    )}

                    {hasPassword && (
                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-1.5">Mot de passe actuel</label>
                        <div className="relative">
                          <input
                            type={showPwdFields ? 'text' : 'password'}
                            value={currentPwd}
                            onChange={e => setCurrentPwd(e.target.value)}
                            placeholder="••••••••"
                            className="input pr-11" />
                          <button type="button" tabIndex={-1} onClick={() => setShowPwdFields(v => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                            {showPwdFields ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">Nouveau mot de passe</label>
                      <div className="relative">
                        <input
                          type={showPwdFields ? 'text' : 'password'}
                          value={newPwd}
                          onChange={e => setNewPwd(e.target.value)}
                          placeholder="Minimum 8 caractères"
                          className="input pr-11" />
                        <button type="button" tabIndex={-1} onClick={() => setShowPwdFields(v => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                          {showPwdFields ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {newPwd && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1.5">
                            {[0, 1, 2, 3].map(i => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                                i < pwdScore
                                  ? ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-primary-500'][pwdScore - 1]
                                  : 'bg-dark-200'
                              }`} />
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                            {pwdCriteriaState.map((c, i) => (
                              <span key={i} className={`flex items-center gap-1 text-[11px] font-medium ${c.met ? 'text-primary-600' : 'text-dark-400'}`}>
                                <CheckCircle size={10} className={c.met ? 'text-primary-500' : 'text-dark-300'} /> {c.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">Confirmer le nouveau mot de passe</label>
                      <input
                        type={showPwdFields ? 'text' : 'password'}
                        value={confirmPwd}
                        onChange={e => setConfirmPwd(e.target.value)}
                        placeholder="Retapez le nouveau mot de passe"
                        className="input" />
                    </div>

                    {pwdError && (
                      <p className="text-sm text-guinea-600 bg-guinea-50 rounded-xl px-4 py-3">{pwdError}</p>
                    )}

                    <button onClick={changePwd} disabled={pwdLoading} className="btn-primary px-8 flex items-center gap-2 disabled:opacity-60">
                      {pwdLoading && <Loader2 size={15} className="animate-spin" />}
                      {hasPassword ? 'Changer le mot de passe' : 'Définir le mot de passe'}
                    </button>

                    {hasPassword && (
                      <Link href="/auth/mot-de-passe-oublie" className="block text-sm text-primary-700 hover:underline pt-1">
                        Mot de passe oublié ? Réinitialiser par email
                      </Link>
                    )}
                  </>
                )}

                {/* ── Questions de sécurité ── */}
                <div className="pt-6 mt-6 border-t border-dark-100">
                  <h3 className="font-semibold text-dark-900 flex items-center gap-2 mb-1">
                    <HelpCircle size={16} className="text-primary-700" /> Questions de sécurité
                  </h3>
                  <p className="text-dark-500 text-sm mb-4">
                    Permettent de récupérer votre compte si vous perdez l'accès à votre email — pratique si vous consultez rarement votre boîte mail.
                  </p>

                  {sqConfigured === null ? (
                    <p className="text-dark-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement...</p>
                  ) : !sqEditing ? (
                    sqConfigured.length >= 2 ? (
                      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck size={16} className="text-primary-700" />
                          <p className="text-primary-800 text-sm font-semibold">{sqConfigured.length} questions configurées</p>
                        </div>
                        <ul className="text-dark-600 text-sm space-y-1 mb-3 list-disc list-inside">
                          {sqConfigured.map(q => <li key={q.questionId}>{q.label}</li>)}
                        </ul>
                        <button onClick={startEditSq} className="text-primary-700 text-sm font-semibold hover:underline">
                          Modifier mes questions de sécurité
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 flex items-start gap-3">
                        <Shield size={18} className="text-gold-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gold-800 text-sm font-semibold mb-1">Aucune question de sécurité configurée</p>
                          <p className="text-gold-700 text-xs mb-3">
                            Ajoutez-en 2 ou 3 pour pouvoir récupérer votre compte même sans accès à votre email.
                          </p>
                          <button onClick={startEditSq} className="btn-gold text-sm px-4 py-2">Configurer maintenant</button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {sqRows.map((row, i) => (
                        <div key={i} className="bg-dark-50 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-dark-700">Question {i + 1}</label>
                            {sqRows.length > 2 && (
                              <button onClick={() => removeSqRow(i)} className="text-guinea-500 text-xs font-semibold hover:underline">Retirer</button>
                            )}
                          </div>
                          <select value={row.questionId} onChange={e => updateSqRow(i, 'questionId', e.target.value)} className="input">
                            <option value="">Choisissez une question...</option>
                            {sqMaster
                              .filter(q => q.id === row.questionId || !sqRows.some(r => r.questionId === q.id))
                              .map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                          </select>
                          <input
                            value={row.answer}
                            onChange={e => updateSqRow(i, 'answer', e.target.value)}
                            placeholder="Votre réponse"
                            className="input" />
                        </div>
                      ))}

                      {sqRows.length < 3 && (
                        <button onClick={addSqRow} className="text-primary-700 text-sm font-semibold hover:underline">
                          + Ajouter une 3ᵉ question (optionnel)
                        </button>
                      )}

                      {sqError && (
                        <p className="text-sm text-guinea-600 bg-guinea-50 rounded-xl px-4 py-3">{sqError}</p>
                      )}

                      <div className="flex items-center gap-4">
                        <button onClick={saveSq} disabled={sqSaving} className="btn-primary px-6 flex items-center gap-2 disabled:opacity-60">
                          {sqSaving && <Loader2 size={15} className="animate-spin" />} Enregistrer
                        </button>
                        <button onClick={() => setSqEditing(false)} className="text-dark-500 text-sm font-semibold hover:text-dark-700">
                          Annuler
                        </button>
                      </div>
                      <p className="text-xs text-dark-400">
                        Vos réponses sont stockées de façon chiffrée (comme un mot de passe) — personne ne peut les relire, seulement vérifier qu'elles correspondent.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!showGate && tab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Préférences de notifications</h2>
                {[
                  { label: 'Nouveaux messages',    sub: 'Être notifié quand vous recevez un message', value: notifMsg,     fn: () => setNotifMsg(!notifMsg) },
                  { label: "Expiration d'annonce", sub: 'Rappel avant que votre annonce expire',       value: notifAnnonce, fn: () => setNotifAnnonce(!notifAnnonce) },
                  { label: 'Nouvelles vues',       sub: 'Quand quelqu\'un consulte vos annonces',      value: notifVue,     fn: () => setNotifVue(!notifVue) },
                ].map((n, i) => (
                  <button key={i} type="button" onClick={n.fn} role="switch" aria-checked={n.value}
                    className="w-full flex items-center justify-between gap-3 p-4 min-h-[44px] bg-dark-50 rounded-2xl text-left hover:bg-dark-100 transition-colors">
                    <div>
                      <p className="font-semibold text-dark-900 text-sm">{n.label}</p>
                      <p className="text-dark-500 text-xs mt-0.5">{n.sub}</p>
                    </div>
                    <Toggle value={n.value} />
                  </button>
                ))}
              </div>
            )}

            {!showGate && tab === 'confidentialite' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Confidentialité</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Profil public',        sub: 'Votre profil est visible par tous les utilisateurs', value: privPublic,   onChange: () => { const v = !privPublic;   setPrivPublic(v);   savePrivacy('profPublic', v); } },
                    { label: 'Afficher mon numéro',  sub: 'Votre numéro est visible sur vos annonces',         value: privPhone,    onChange: () => { const v = !privPhone;    setPrivPhone(v);    savePrivacy('showPhone', v); } },
                    { label: 'Recevoir des messages',sub: 'Les autres utilisateurs peuvent vous contacter',     value: privMessages, onChange: () => { const v = !privMessages; setPrivMessages(v); savePrivacy('acceptMessages', v); } },
                  ].map((item, i) => (
                    <button key={i} type="button" onClick={item.onChange} role="switch" aria-checked={item.value}
                      className="w-full flex items-center justify-between gap-3 p-4 min-h-[44px] bg-dark-50 rounded-2xl text-left hover:bg-dark-100 transition-colors">
                      <div>
                        <p className="font-semibold text-dark-900 text-sm">{item.label}</p>
                        <p className="text-dark-500 text-xs mt-0.5">{item.sub}</p>
                      </div>
                      <Toggle value={item.value} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'apparence' && (
              <div className="space-y-8">

                {/* ── Mode clair / sombre ── */}
                <div>
                  <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-2">Apparence</h2>
                  <p className="text-dark-500 text-sm mb-5">Choisissez comment TrouveTout224 s&apos;affiche sur votre appareil.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'light',  label: 'Clair',       icon: Sun,     desc: 'Toujours clair',      bg: 'bg-white border-dark-200' },
                      { value: 'dark',   label: 'Sombre',      icon: Moon,    desc: 'Toujours sombre',     bg: 'bg-dark-900 border-dark-700' },
                      { value: 'system', label: 'Automatique', icon: Monitor, desc: 'Suit votre appareil', bg: 'bg-gradient-to-br from-white to-dark-800 border-dark-300' },
                    ] as const).map(opt => {
                      const Icon = opt.icon;
                      const active = theme === opt.value;
                      return (
                        <button key={opt.value} onClick={() => setTheme(opt.value)}
                          className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
                            active ? 'border-primary-700 bg-primary-50' : 'border-dark-200 hover:border-primary-400 hover:bg-dark-50'
                          }`}>
                          <div className={`w-full h-12 rounded-xl border ${opt.bg} flex items-center justify-center`}>
                            <Icon size={20} className={active ? 'text-primary-700' : 'text-dark-400'} />
                          </div>
                          <p className={`font-semibold text-sm ${active ? 'text-primary-700' : 'text-dark-700'}`}>{opt.label}</p>
                          <p className="text-dark-400 text-xs text-center leading-tight">{opt.desc}</p>
                          {active && <CheckCircle size={15} className="text-primary-700" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Couleur d'accent (base, libres) ── */}
                <div>
                  <h3 className="font-semibold text-dark-900 mb-1 flex items-center gap-2">
                    <Palette size={15} className="text-primary-700" /> Couleur d&apos;accent
                  </h3>
                  <p className="text-dark-500 text-xs mb-4">Change la couleur principale des boutons, liens et éléments actifs.</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {COLOR_THEMES.filter(ct => !ct.isSpecial).map(ct => {
                      const active = colorAccent === ct.id && !specialTheme;
                      return (
                        <button key={ct.id} onClick={() => setColorAccent(ct.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                            active ? 'border-primary-700 bg-primary-50' : 'border-dark-200 hover:border-dark-400 hover:bg-dark-50'
                          }`}>
                          <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: ct.hex }} />
                          <p className={`text-xs font-semibold text-center leading-tight ${active ? 'text-primary-700' : 'text-dark-600'}`}>
                            {ct.emoji} {ct.label}
                          </p>
                          {active && <CheckCircle size={12} className="text-primary-700" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Thèmes spéciaux animés (visibles seulement si débloqués) ── */}
                {(() => {
                  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
                  const visibleSpecial = COLOR_THEMES.filter(ct =>
                    ct.isSpecial &&
                    // adminOnly: toujours visible pour l'admin, jamais pour les autres
                    // isSpecial normal: visible si débloqué
                    (ct.adminOnly ? isAdmin : !isThemeLocked(ct.id))
                  );
                  if (visibleSpecial.length === 0) return null;
                  return (
                    <div>
                      <h3 className="font-semibold text-dark-900 mb-1 flex items-center gap-2">
                        <span className="text-base">🎨</span> Thèmes spéciaux &amp; animés
                      </h3>
                      <p className="text-dark-500 text-xs mb-4">
                        Ambiances immersives avec animations fluides.
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {visibleSpecial.map(ct => {
                          const active = colorAccent === ct.id && !specialTheme;
                          return (
                            <button
                              key={ct.id}
                              onClick={() => setColorAccent(ct.id)}
                              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                                active
                                  ? 'border-primary-700 bg-primary-50'
                                  : 'border-dark-200 hover:border-dark-400 hover:bg-dark-50'
                              }`}>
                              <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: ct.hex }} />
                              <p className={`text-xs font-semibold text-center leading-tight ${active ? 'text-primary-700' : 'text-dark-600'}`}>
                                {ct.emoji} {ct.label}
                              </p>
                              {active && <CheckCircle size={12} className="text-primary-700" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Thèmes événementiels ── */}
                {(() => {
                  const visibleEvents = SPECIAL_THEMES.filter(st => !isThemeLocked(st.id));
                  if (visibleEvents.length === 0) return null;
                  return (
                    <div>
                      <h3 className="font-semibold text-dark-900 mb-1 flex items-center gap-2">
                        <span className="text-base">✨</span> Thèmes événementiels
                      </h3>
                      <p className="text-dark-500 text-xs mb-4">Ambiances festives avec banderole décorative en haut de page.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {visibleEvents.map(st => {
                          const active = specialTheme === st.id;
                          return (
                            <button
                              key={st.id}
                              onClick={() => setSpecialTheme(active ? null : st.id as any)}
                              className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                                active
                                  ? 'border-primary-700 bg-primary-50'
                                  : 'border-dark-200 hover:border-dark-400 hover:bg-dark-50'
                              }`}>
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                                style={{ backgroundColor: st.hex + '22' }}>
                                {st.emoji}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold ${active ? 'text-primary-700' : 'text-dark-800'}`}>{st.label}</p>
                                <p className="text-dark-400 text-xs leading-tight mt-0.5">{st.description}</p>
                              </div>
                              {active && <CheckCircle size={14} className="text-primary-700 ml-auto shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      {specialTheme && (
                        <button onClick={() => setSpecialTheme(null)}
                          className="mt-3 text-xs text-dark-500 hover:text-dark-700 underline">
                          Revenir à la couleur normale
                        </button>
                      )}
                    </div>
                  );
                })()}

              </div>
            )}

            {tab === 'langue' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Langue de l'interface</h2>
                <div className="space-y-2">
                  {LANGS.map(({ code, label, badge, note }) => (
                    <label key={code}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 border-dark-200 hover:border-primary-400 cursor-pointer has-[:checked]:border-primary-700 has-[:checked]:bg-primary-50 transition-colors">
                      <input type="radio" name="lang" defaultChecked={code === 'fr'} className="accent-primary-700" />
                      <span className="w-8 h-6 rounded bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">{badge}</span>
                      <span className="font-medium text-dark-700">{label}</span>
                      {note && <span className="ml-auto text-xs text-primary-700 font-semibold">{note}</span>}
                    </label>
                  ))}
                </div>
                <p className="text-dark-400 text-xs mt-4">Les traductions en anglais et arabe seront disponibles prochainement.</p>
              </div>
            )}

            {tab === 'aide' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Aide & Support</h2>
                <div className="space-y-3">
                  {HELP_ITEMS.map(({ Icon, text, href }) => (
                    <a key={href} href={href}
                      className="flex items-center gap-3 p-4 rounded-xl border border-dark-200 hover:border-primary-400 hover:bg-primary-50 transition-colors group">
                      <div className="w-9 h-9 bg-dark-50 group-hover:bg-primary-100 rounded-xl flex items-center justify-center transition-colors shrink-0">
                        <Icon size={16} className="text-dark-500 group-hover:text-primary-700 transition-colors" />
                      </div>
                      <span className="font-medium text-dark-700 flex-1">{text}</span>
                      <ArrowRight size={15} className="text-dark-300 group-hover:text-primary-700 transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {tab === 'conditions' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Conditions d'utilisation</h2>
                <div className="prose prose-sm text-dark-600 space-y-4">
                  <p>En utilisant TrouveTout224, vous acceptez les présentes conditions.</p>
                  <div>
                    <h3 className="font-semibold text-dark-800">1. Utilisation du service</h3>
                    <p>TrouveTout224 est une plateforme d'annonces destinée aux résidents de Guinée. L'âge minimum est de 13 ans.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-800">2. Contenu interdit</h3>
                    <p>Il est strictement interdit de publier du contenu illégal, offensant, des arnaques, de la nudité ou de la violence.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-800">3. Responsabilité</h3>
                    <p>TrouveTout224 n'est pas responsable des transactions entre utilisateurs. Soyez vigilants et rencontrez les vendeurs dans des lieux publics.</p>
                  </div>
                </div>
              </div>
            )}

            {tab === 'apropos' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-premium">
                  <span className="text-white font-display font-bold text-2xl">TT</span>
                </div>
                <h2 className="text-2xl font-display font-bold mb-1">
                  <span className="text-primary-700">TrouveTout</span><span className="text-yellow-500">224</span>
                </h2>
                <p className="text-dark-400 text-sm mb-6">Version 1.0.0 · Conakry, République de Guinée</p>
                <p className="text-dark-600 max-w-md mx-auto text-sm leading-relaxed mb-6">
                  La plus grande plateforme d'annonces et marketplace de Guinée. Notre mission est de connecter acheteurs et vendeurs partout en Guinée.
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6 text-center">
                  <div className="bg-primary-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-primary-700">21</p>
                    <p className="text-xs text-dark-500">Catégories</p>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-primary-700">8</p>
                    <p className="text-xs text-dark-500">Villes</p>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-primary-700">GN</p>
                    <p className="text-xs text-dark-500">Guinée</p>
                  </div>
                </div>
                <p className="text-dark-400 text-xs">© {new Date().getFullYear()} TrouveTout224 · Tous droits réservés</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
