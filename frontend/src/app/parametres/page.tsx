'use client';
import { useState, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import {
  User, Lock, Bell, Shield, Globe, HelpCircle, FileText, Info, LogOut,
  Settings, CheckCircle, ArrowRight, Mail, CreditCard, ShieldCheck, Link2,
  Palette, Sun, Moon, Monitor, Eye, EyeOff, Loader2, KeyRound,
  Camera, AtSign, XCircle, Phone, Type, Clock,
} from 'lucide-react';
import { useTheme, COLOR_THEMES, SPECIAL_THEMES } from '@/components/providers/ThemeProvider';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import BackButton from '@/components/BackButton';
import VoiceSettingsSection from '@/components/settings/VoiceSettingsSection';
import Link from 'next/link';

const TAB_HREFS = [
  { key: 'profil',          icon: User },
  { key: 'securite',        icon: Lock },
  { key: 'notifications',   icon: Bell },
  { key: 'confidentialite', icon: Shield },
  { key: 'apparence',       icon: Palette },
  { key: 'langue',          icon: Globe },
  { key: 'aide',            icon: HelpCircle },
  { key: 'conditions',      icon: FileText },
  { key: 'apropos',         icon: Info },
] as const;

// Regroupement visuel de la sidebar (desktop) — ne change ni les clés ni la logique des onglets
const TAB_GROUP_HREFS: { key: string; keys: string[] }[] = [
  { key: 'compte',      keys: ['profil', 'securite', 'confidentialite', 'notifications'] },
  { key: 'preferences', keys: ['apparence', 'langue'] },
  { key: 'support',     keys: ['aide', 'conditions', 'apropos'] },
];

const HELP_ITEM_HREFS = [
  { Icon: HelpCircle, key: 'publier',      href: '/aide/publier' },
  { Icon: Shield,     key: 'signalement',  href: '/aide/signalement' },
  { Icon: Mail,       key: 'contact',      href: '/contact' },
  { Icon: Link2,      key: 'centreAide',   href: '/aide' },
] as const;

const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'Français', badge: 'FR' },
  { code: 'en', flag: '🇬🇧', label: 'English',  badge: 'EN' },
  { code: 'zh', flag: '🇨🇳', label: '中文',      badge: 'ZH' },
] as const;

const PROTECTED_TABS = ['profil', 'securite', 'notifications', 'confidentialite'];

// Doit correspondre à SENSITIVE_CHANGE_COOLDOWN_DAYS côté backend
// (backend/src/config/security.ts) — purement informatif ici, le backend reste
// la seule source de vérité qui bloque réellement la requête.
const COOLDOWN_DAYS = 7;

function cooldownInfo(changedAt?: string | null): { days: number; dateStr: string } | null {
  if (!changedAt) return null;
  const next = new Date(new Date(changedAt).getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  if (next.getTime() <= Date.now()) return null;
  const days = Math.max(1, Math.ceil((next.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  const dateStr = next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return { days, dateStr };
}

export default function ParametresPage() {
  const { user, logout, isAuthenticated, _hasHydrated, setUser } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated && !!user;
  const { theme, setTheme, colorAccent, setColorAccent, specialTheme, setSpecialTheme, isThemeLocked, textSize, setTextSize } = useTheme();
  const { locale, switchLocale, isPending: localePending } = useLanguageSwitch();
  const t = useTranslations('parametres');
  const tSecurity = useTranslations('security');
  const TABS = TAB_HREFS.map(tb => ({ ...tb, label: t(`tabs.${tb.key}`) }));
  const TAB_GROUPS = TAB_GROUP_HREFS.map(g => ({ ...g, label: t(`tabGroups.${g.key}`) }));
  const HELP_ITEMS = HELP_ITEM_HREFS.map(h => ({ ...h, text: t(`aide.items.${h.key}`) }));
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
  // Téléphone (ajout/modification)
  const [phoneInput, setPhoneInput]     = useState('');
  const [phoneSaving, setPhoneSaving]   = useState(false);
  const [phoneError, setPhoneError]     = useState('');
  // Changement d'email
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailPwd, setEmailPwd]           = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError]     = useState('');
  const [emailChangeSent, setEmailChangeSent]       = useState(false);
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
    if (sqRows.some(r => !r.questionId)) return setSqError(t('securite.errors.sqQuestionRequired'));
    if (sqRows.some(r => r.answer.trim().length < 2)) return setSqError(t('securite.errors.sqAnswerTooShort'));
    const ids = sqRows.map(r => r.questionId);
    if (new Set(ids).size !== ids.length) return setSqError(t('securite.errors.sqDuplicate'));

    setSqSaving(true);
    try {
      await api.put('/users/me/security-questions', { questions: sqRows });
      setSqConfigured(sqRows.map(r => ({ questionId: r.questionId, label: sqMaster.find(q => q.id === r.questionId)?.label || r.questionId })));
      setSqEditing(false);
      toast.success(t('toasts.sqSaved'));
    } catch (e: any) {
      setSqError(e.response?.data?.error || t('securite.errors.sqGeneric'));
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
    const timer = setTimeout(() => {
      api.get('/users/username-available', { params: { username: trimmed } })
        .then(r => setUsernameStatus(r.data.available ? 'available' : 'taken'))
        .catch(() => setUsernameStatus('idle'));
    }, 450);
    return () => clearTimeout(timer);
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
      toast.success(t('toasts.avatarUpdated'));
    } catch { toast.error(t('toasts.avatarUploadError')); }
    finally { setAvatarUploading(false); }
  };

  const PWD_CRITERIA = [
    { ok: (p: string) => p.length >= 8,   text: t('securite.criteria.length') },
    { ok: (p: string) => /[A-Z]/.test(p), text: t('securite.criteria.uppercase') },
    { ok: (p: string) => /[a-z]/.test(p), text: t('securite.criteria.lowercase') },
    { ok: (p: string) => /[0-9]/.test(p), text: t('securite.criteria.digit') },
  ];
  const pwdCriteriaState = PWD_CRITERIA.map(c => ({ ...c, met: c.ok(newPwd) }));
  const pwdScore = pwdCriteriaState.filter(c => c.met).length;

  const saveProfile = async () => {
    if (usernameStatus === 'taken') return toast.error(t('toasts.usernameTakenError'));
    if (usernameStatus === 'invalid') return toast.error(t('toasts.usernameInvalidError'));
    if (usernameStatus === 'checking') return toast.error(t('toasts.usernameCheckingError'));

    setProfileLoading(true);
    try {
      const payload: Record<string, unknown> = { firstName, lastName, bio, cityId: cityId || undefined };
      if (username.trim() && usernameStatus !== 'unchanged') payload.username = username.trim().toLowerCase();

      const { data } = await api.put('/users/me', payload);
      setMeData(data.data);
      if (user) setUser({ ...user, firstName, lastName });
      toast.success(t('toasts.profileUpdated'));
    } catch (e: any) {
      const d = e.response?.data;
      if (d?.field === 'username') setUsernameStatus('taken');
      toast.error(d?.error || t('toasts.profileUpdateError'));
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
      setPwdError(t('securite.errors.currentPasswordRequired'));
      return;
    }
    if (!newPwd || !confirmPwd) {
      setPwdError(t('securite.errors.newPasswordRequired'));
      return;
    }
    if (pwdScore < PWD_CRITERIA.length) {
      setPwdError(t('securite.errors.passwordCriteria'));
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError(t('securite.errors.passwordMismatch'));
      return;
    }
    if (hasPassword && newPwd === currentPwd) {
      setPwdError(t('securite.errors.passwordSameAsOld'));
      return;
    }

    setPwdLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: hasPassword ? currentPwd : undefined,
        newPassword: newPwd,
      });
      toast.success(hasPassword ? t('toasts.passwordChanged') : t('toasts.passwordSet'));
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setHasPassword(true);
    } catch (e: any) {
      const d = e.response?.data;
      setPwdError(d?.error || (Array.isArray(d?.errors) ? d.errors[0]?.msg : null) || t('securite.errors.passwordGeneric'));
    } finally {
      setPwdLoading(false);
    }
  };

  const savePhone = async () => {
    setPhoneError('');
    if (!/^6\d{8}$/.test(phoneInput)) {
      setPhoneError(t('profil.phoneInvalid'));
      return;
    }
    setPhoneSaving(true);
    try {
      const { data } = await api.put('/users/me/phone', { phone: phoneInput });
      setMeData((m: any) => ({ ...m, phone: data.data.phone, phoneChangedAt: new Date().toISOString() }));
      setPhoneInput('');
      toast.success(t('toasts.phoneUpdated'));
    } catch (e: any) {
      setPhoneError(e.response?.data?.error || t('securite.errors.phoneGeneric'));
    } finally {
      setPhoneSaving(false);
    }
  };

  const requestEmailChange = async () => {
    setEmailChangeError('');
    const trimmed = newEmailInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailChangeError(t('securite.errors.emailInvalid'));
      return;
    }
    setEmailChangeLoading(true);
    try {
      const { data } = await api.put('/users/me/email', { newEmail: trimmed, currentPassword: emailPwd || undefined });
      toast.success(data.message || t('toasts.emailLinkSent'));
      setEmailChangeSent(true);
    } catch (e: any) {
      setEmailChangeError(e.response?.data?.error || t('securite.errors.emailGeneric'));
    } finally {
      setEmailChangeLoading(false);
    }
  };

  // Purement visuel — le clic est géré par la ligne entière qui l'entoure (cible tactile ≥ 44px)
  const Toggle = ({ value }: { value: boolean }) => (
    <span aria-hidden className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-primary-700' : 'bg-dark-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </span>
  );

  const phoneCooldown = cooldownInfo(meData?.phoneChangedAt);
  const emailCooldown = cooldownInfo(meData?.emailChangedAt);
  const pwdCooldown   = cooldownInfo(meData?.passwordChangedAt);
  const sqCooldown    = cooldownInfo(meData?.securityQuestionsChangedAt);

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
          <BackButton label={t('header.title')} fallbackHref="/profil" className="text-white/80 hover:bg-white/10 hover:text-white mb-3" />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Settings size={20} className="text-gold-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{t('header.title')}</h1>
              <p className="text-white/75 text-xs sm:text-sm">{t('header.subtitle')}</p>
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
              {TABS.map(tb => {
                const isProtected = PROTECTED_TABS.includes(tb.key);
                return (
                  <button key={tb.key} onClick={() => setTab(tb.key)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold whitespace-nowrap transition-colors snap-start
                      ${tab === tb.key ? 'bg-primary-700 text-white shadow-sm' : 'bg-dark-50 text-dark-600'}`}>
                    <tb.icon size={15} className="shrink-0" />
                    {tb.label}
                    {isProtected && !loggedIn && (
                      <Lock size={10} className="shrink-0 opacity-50" />
                    )}
                  </button>
                );
              })}
              {loggedIn ? (
                <button onClick={logout}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold text-red-600 bg-red-50 whitespace-nowrap snap-start">
                  <LogOut size={15} className="shrink-0" /> {t('logout')}
                </button>
              ) : (
                <Link href="/auth/connexion"
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold text-primary-700 bg-primary-50 whitespace-nowrap snap-start">
                  <User size={15} className="shrink-0" /> {t('login')}
                </Link>
              )}
            </div>

            {/* Desktop : colonne verticale groupée en sections claires */}
            <div className="hidden lg:block p-3 space-y-4">
              {TAB_GROUPS.map(group => (
                <div key={group.key}>
                  <p className="px-3 mb-1.5 text-[11px] font-bold text-dark-400 uppercase tracking-wider">{group.label}</p>
                  <div className="space-y-0.5">
                    {TABS.filter(tb => group.keys.includes(tb.key)).map(tb => {
                      const isProtected = PROTECTED_TABS.includes(tb.key);
                      return (
                        <button key={tb.key} onClick={() => setTab(tb.key)}
                          className={`w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors
                            ${tab === tb.key ? 'bg-primary-700 text-white shadow-sm' : 'text-dark-600 hover:bg-dark-50'}`}>
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tab === tb.key ? 'bg-white/20' : 'bg-primary-50'}`}>
                            <tb.icon size={14} className={tab === tb.key ? 'text-white' : 'text-primary-700'} />
                          </span>
                          <span className="flex-1 text-left">{tb.label}</span>
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
                    <LogOut size={15} className="shrink-0" /> {t('logout')}
                  </button>
                ) : (
                  <Link href="/auth/connexion"
                    className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors">
                    <User size={15} className="shrink-0" /> {t('login')}
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
                <h3 className="font-bold text-dark-900 text-lg mb-2">{t('gate.title')}</h3>
                <p className="text-dark-500 text-sm mb-6 max-w-xs leading-relaxed">
                  {t('gate.text')}
                </p>
                <div className="flex gap-3 flex-wrap justify-center">
                  <Link href="/auth/connexion" className="btn-primary">{t('gate.login')}</Link>
                  <Link href="/auth/inscription" className="btn-outline">{t('gate.createAccount')}</Link>
                </div>
                <p className="text-dark-400 text-xs mt-5">
                  {t('gate.appearanceNotePrefix')}<strong>{t('gate.appearanceNoteBold')}</strong>{t('gate.appearanceNoteSuffix')}
                </p>
              </div>
            ) : null}

            {!showGate && tab === 'profil' && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-1">{t('profil.title')}</h2>

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
                      <Camera size={13} /> {t('profil.changePhoto')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('profil.firstName')}</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('profil.lastName')}</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} className="input" />
                  </div>
                </div>

                {/* Nom d'utilisateur — pseudo unique */}
                <div>
                  <label className="text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                    <AtSign size={13} className="text-primary-700" /> {t('profil.username')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-sm font-semibold pointer-events-none">@</span>
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder={t('profil.usernamePlaceholder')}
                      className="input pl-8 pr-9"
                      maxLength={20}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && <Loader2 size={15} className="animate-spin text-dark-400" />}
                      {usernameStatus === 'available' && <CheckCircle size={15} className="text-primary-600" />}
                      {usernameStatus === 'taken' && <XCircle size={15} className="text-guinea-500" />}
                    </span>
                  </div>
                  {usernameStatus === 'taken' && <p className="text-xs text-guinea-600 mt-1.5">{t('profil.usernameTaken')}</p>}
                  {usernameStatus === 'invalid' && <p className="text-xs text-guinea-600 mt-1.5">{t('profil.usernameInvalid')}</p>}
                  {usernameStatus === 'available' && <p className="text-xs text-primary-600 mt-1.5">{t('profil.usernameAvailable')}</p>}
                  {usernameStatus === 'idle' && <p className="text-xs text-dark-400 mt-1.5">{t('profil.usernameHint')}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('profil.bio')}</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    placeholder={t('profil.bioPlaceholder')} className="input resize-none" />
                </div>

                {/* Email (lecture seule ici — le changement se fait dans l'onglet Sécurité) */}
                <div>
                  <label className="text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                    <Mail size={13} className="text-dark-400" /> {t('profil.email')}
                  </label>
                  <input
                    value={meData?.email || t('profil.emailNotSet')}
                    disabled
                    className="input bg-dark-50 text-dark-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    {t('profil.emailChangeHintPrefix')}<strong>{t('profil.emailChangeHintBold')}</strong>{t('profil.emailChangeHintSuffix')}
                  </p>
                </div>

                {/* Téléphone — ajout/modification directe, sert au contact WhatsApp */}
                <div>
                  <label className="text-sm font-semibold text-dark-700 mb-1.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-dark-400" /> {t('profil.phone')}
                  </label>
                  <p className="text-xs text-dark-500 mb-2">{t('profil.phoneHint')}</p>

                  {phoneCooldown ? (
                    <>
                      <input value={meData?.phone || ''} disabled className="input bg-dark-50 text-dark-500 cursor-not-allowed" />
                      <p className="text-xs text-gold-700 bg-gold-50 border border-gold-200 rounded-xl px-3 py-2 mt-2 flex items-center gap-1.5">
                        <Clock size={12} className="shrink-0" /> {t('profil.cooldownGeneric', { days: phoneCooldown.days, plural: phoneCooldown.days > 1 ? 's' : '', date: phoneCooldown.dateStr })}
                      </p>
                    </>
                  ) : (
                    <>
                      {meData?.phone && (
                        <p className="text-sm text-dark-600 mb-2">{t('profil.phoneCurrent', { phone: '' })}<strong>{meData.phone}</strong></p>
                      )}
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 text-sm font-semibold pointer-events-none">+224</span>
                        <input
                          value={phoneInput}
                          onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 9))}
                          placeholder={t('profil.phonePlaceholder')}
                          className="input pl-14"
                        />
                      </div>
                      {phoneError && <p className="text-xs text-guinea-600 mt-1.5">{phoneError}</p>}
                      <button
                        onClick={savePhone}
                        disabled={phoneSaving || phoneInput.length !== 9}
                        className="mt-2 text-primary-700 text-sm font-semibold hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1.5"
                      >
                        {phoneSaving && <Loader2 size={13} className="animate-spin" />}
                        {meData?.phone ? t('profil.phoneUpdate') : t('profil.phoneAdd')}
                      </button>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('profil.city')}</label>
                  <select value={cityId} onChange={e => setCityId(e.target.value)} className="input">
                    <option value="">{t('profil.cityNotSet')}</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <button onClick={saveProfile} disabled={profileLoading} className="btn-primary px-8 flex items-center gap-2 disabled:opacity-60">
                  {profileLoading && <Loader2 size={15} className="animate-spin" />}
                  {t('profil.save')}
                </button>
              </div>
            )}

            {!showGate && tab === 'securite' && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">{t('securite.title')}</h2>
                <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border border-primary-200 mb-4">
                  <ShieldCheck size={18} className="text-primary-700 shrink-0" />
                  <p className="text-primary-800 text-sm font-medium">{t('securite.accountSecure')}</p>
                </div>

                {hasPassword === null ? (
                  <p className="text-dark-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {t('securite.loading')}</p>
                ) : (
                  <>
                    <h3 className="font-semibold text-dark-900 flex items-center gap-2">
                      <KeyRound size={16} className="text-primary-700" />
                      {hasPassword ? t('securite.changePassword') : t('securite.setPassword')}
                    </h3>

                    {!hasPassword && (
                      <p className="text-dark-500 text-sm bg-dark-50 rounded-2xl p-4">
                        {t('securite.googleAccountHint')}
                      </p>
                    )}

                    {hasPassword && pwdCooldown ? (
                      <p className="text-sm text-gold-700 bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 flex items-center gap-2">
                        <Clock size={14} className="shrink-0" />
                        {t('profil.cooldownPassword', { days: pwdCooldown.days, plural: pwdCooldown.days > 1 ? 's' : '', date: pwdCooldown.dateStr })}
                      </p>
                    ) : (
                      <>
                        {hasPassword && (
                          <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('securite.currentPassword')}</label>
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
                          <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('securite.newPassword')}</label>
                          <div className="relative">
                            <input
                              type={showPwdFields ? 'text' : 'password'}
                              value={newPwd}
                              onChange={e => setNewPwd(e.target.value)}
                              placeholder={t('securite.newPasswordPlaceholder')}
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
                          <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('securite.confirmPassword')}</label>
                          <input
                            type={showPwdFields ? 'text' : 'password'}
                            value={confirmPwd}
                            onChange={e => setConfirmPwd(e.target.value)}
                            placeholder={t('securite.confirmPasswordPlaceholder')}
                            className="input" />
                        </div>

                        {pwdError && (
                          <p className="text-sm text-guinea-600 bg-guinea-50 rounded-xl px-4 py-3">{pwdError}</p>
                        )}

                        <button onClick={changePwd} disabled={pwdLoading} className="btn-primary px-8 flex items-center gap-2 disabled:opacity-60">
                          {pwdLoading && <Loader2 size={15} className="animate-spin" />}
                          {hasPassword ? t('securite.changePassword') : t('securite.setPassword')}
                        </button>
                      </>
                    )}

                    {hasPassword && (
                      <Link href="/auth/mot-de-passe-oublie" className="block text-sm text-primary-700 hover:underline pt-1">
                        {t('securite.forgotPassword')}
                      </Link>
                    )}
                  </>
                )}

                {/* ── Adresse email ── */}
                <div className="pt-6 mt-6 border-t border-dark-100">
                  <h3 className="font-semibold text-dark-900 flex items-center gap-2 mb-1">
                    <Mail size={16} className="text-primary-700" /> {t('securite.emailTitle')}
                  </h3>
                  <p className="text-dark-500 text-sm mb-4">
                    {meData?.email ? <>{t('securite.emailCurrent', { email: '' })}<strong>{meData.email}</strong></> : t('securite.emailNone')}
                  </p>

                  {emailCooldown ? (
                    <p className="text-sm text-gold-700 bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 flex items-center gap-2">
                      <Clock size={14} className="shrink-0" />
                      {t('profil.cooldownGeneric', { days: emailCooldown.days, plural: emailCooldown.days > 1 ? 's' : '', date: emailCooldown.dateStr })}
                    </p>
                  ) : emailChangeSent ? (
                    <p className="text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
                      {t('securite.emailSent', { email: newEmailInput.trim() })}
                    </p>
                  ) : (
                    <div className="space-y-3 max-w-md">
                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('securite.newEmail')}</label>
                        <input
                          type="email"
                          value={newEmailInput}
                          onChange={e => setNewEmailInput(e.target.value)}
                          placeholder={t('securite.newEmailPlaceholder')}
                          className="input"
                        />
                      </div>
                      {hasPassword && (
                        <div>
                          <label className="block text-sm font-semibold text-dark-700 mb-1.5">{t('securite.currentPassword')}</label>
                          <input
                            type="password"
                            value={emailPwd}
                            onChange={e => setEmailPwd(e.target.value)}
                            placeholder="••••••••"
                            className="input"
                          />
                        </div>
                      )}
                      {emailChangeError && (
                        <p className="text-sm text-guinea-600 bg-guinea-50 rounded-xl px-4 py-3">{emailChangeError}</p>
                      )}
                      <button
                        onClick={requestEmailChange}
                        disabled={emailChangeLoading || !newEmailInput.trim()}
                        className="btn-primary px-6 flex items-center gap-2 disabled:opacity-60"
                      >
                        {emailChangeLoading && <Loader2 size={15} className="animate-spin" />}
                        {meData?.email ? t('securite.changeEmail') : t('securite.addEmail')}
                      </button>
                      <p className="text-xs text-dark-400">
                        {t('securite.emailChangeHint')}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Questions de sécurité ── */}
                <div className="pt-6 mt-6 border-t border-dark-100">
                  <h3 className="font-semibold text-dark-900 flex items-center gap-2 mb-1">
                    <HelpCircle size={16} className="text-primary-700" /> {t('securite.sqTitle')}
                  </h3>
                  <p className="text-dark-500 text-sm mb-4">
                    {t('securite.sqHint')}
                  </p>

                  {sqConfigured === null ? (
                    <p className="text-dark-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {t('securite.loading')}</p>
                  ) : !sqEditing ? (
                    sqConfigured.length >= 2 ? (
                      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck size={16} className="text-primary-700" />
                          <p className="text-primary-800 text-sm font-semibold">{t('securite.sqConfiguredCount', { count: sqConfigured.length })}</p>
                        </div>
                        <ul className="text-dark-600 text-sm space-y-1 mb-3 list-disc list-inside">
                          {sqConfigured.map(q => <li key={q.questionId}>{tSecurity(`questions.${q.questionId}`)}</li>)}
                        </ul>
                        {sqCooldown ? (
                          <p className="text-xs text-gold-700 bg-gold-50 border border-gold-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                            <Clock size={12} className="shrink-0" /> {t('profil.cooldownGeneric', { days: sqCooldown.days, plural: sqCooldown.days > 1 ? 's' : '', date: sqCooldown.dateStr })}
                          </p>
                        ) : (
                          <button onClick={startEditSq} className="text-primary-700 text-sm font-semibold hover:underline">
                            {t('securite.sqEdit')}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 flex items-start gap-3">
                        <Shield size={18} className="text-gold-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gold-800 text-sm font-semibold mb-1">{t('securite.sqNoneTitle')}</p>
                          <p className="text-gold-700 text-xs mb-3">
                            {t('securite.sqNoneHint')}
                          </p>
                          <button onClick={startEditSq} className="btn-gold text-sm px-4 py-2">{t('securite.sqConfigureNow')}</button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {sqRows.map((row, i) => (
                        <div key={i} className="bg-dark-50 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-dark-700">{t('securite.sqQuestionLabel', { n: i + 1 })}</label>
                            {sqRows.length > 2 && (
                              <button onClick={() => removeSqRow(i)} className="text-guinea-500 text-xs font-semibold hover:underline">{t('securite.sqRemove')}</button>
                            )}
                          </div>
                          <select value={row.questionId} onChange={e => updateSqRow(i, 'questionId', e.target.value)} className="input">
                            <option value="">{t('securite.sqChoosePlaceholder')}</option>
                            {sqMaster
                              .filter(q => q.id === row.questionId || !sqRows.some(r => r.questionId === q.id))
                              .map(q => <option key={q.id} value={q.id}>{tSecurity(`questions.${q.id}`)}</option>)}
                          </select>
                          <input
                            value={row.answer}
                            onChange={e => updateSqRow(i, 'answer', e.target.value)}
                            placeholder={t('securite.sqAnswerPlaceholder')}
                            className="input" />
                        </div>
                      ))}

                      {sqRows.length < 3 && (
                        <button onClick={addSqRow} className="text-primary-700 text-sm font-semibold hover:underline">
                          {t('securite.sqAddThird')}
                        </button>
                      )}

                      {sqError && (
                        <p className="text-sm text-guinea-600 bg-guinea-50 rounded-xl px-4 py-3">{sqError}</p>
                      )}

                      <div className="flex items-center gap-4">
                        <button onClick={saveSq} disabled={sqSaving} className="btn-primary px-6 flex items-center gap-2 disabled:opacity-60">
                          {sqSaving && <Loader2 size={15} className="animate-spin" />} {t('securite.sqSave')}
                        </button>
                        <button onClick={() => setSqEditing(false)} className="text-dark-500 text-sm font-semibold hover:text-dark-700">
                          {t('securite.sqCancel')}
                        </button>
                      </div>
                      <p className="text-xs text-dark-400">
                        {t('securite.sqFooterHint')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!showGate && tab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">{t('notifications.title')}</h2>
                {[
                  { label: t('notifications.newMessages.label'),    sub: t('notifications.newMessages.sub'),    value: notifMsg,     fn: () => setNotifMsg(!notifMsg) },
                  { label: t('notifications.annonceExpiry.label'),  sub: t('notifications.annonceExpiry.sub'),  value: notifAnnonce, fn: () => setNotifAnnonce(!notifAnnonce) },
                  { label: t('notifications.newViews.label'),       sub: t('notifications.newViews.sub'),       value: notifVue,     fn: () => setNotifVue(!notifVue) },
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
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">{t('confidentialite.title')}</h2>
                <div className="space-y-4">
                  {[
                    { label: t('confidentialite.publicProfile.label'),   sub: t('confidentialite.publicProfile.sub'),   value: privPublic,   onChange: () => { const v = !privPublic;   setPrivPublic(v);   savePrivacy('profPublic', v); } },
                    { label: t('confidentialite.showPhone.label'),       sub: t('confidentialite.showPhone.sub'),       value: privPhone,    onChange: () => { const v = !privPhone;    setPrivPhone(v);    savePrivacy('showPhone', v); } },
                    { label: t('confidentialite.acceptMessages.label'), sub: t('confidentialite.acceptMessages.sub'), value: privMessages, onChange: () => { const v = !privMessages; setPrivMessages(v); savePrivacy('acceptMessages', v); } },
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
                  <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-2">{t('apparence.title')}</h2>
                  <p className="text-dark-500 text-sm mb-5">{t('apparence.subtitle')}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'light',  label: t('apparence.modes.light.label'),  icon: Sun,     desc: t('apparence.modes.light.desc'),  bg: 'bg-white border-dark-200' },
                      { value: 'dark',   label: t('apparence.modes.dark.label'),   icon: Moon,    desc: t('apparence.modes.dark.desc'),   bg: 'bg-dark-900 border-dark-700' },
                      { value: 'system', label: t('apparence.modes.system.label'), icon: Monitor, desc: t('apparence.modes.system.desc'), bg: 'bg-gradient-to-br from-white to-dark-800 border-dark-300' },
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

                {/* ── Taille du texte ── */}
                <div>
                  <h3 className="font-semibold text-dark-900 mb-1 flex items-center gap-2">
                    <Type size={15} className="text-primary-700" /> {t('apparence.textSize.title')}
                  </h3>
                  <p className="text-dark-500 text-xs mb-4">{t('apparence.textSize.subtitle')}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'sm',   label: t('apparence.textSize.sm'),   px: 16 },
                      { value: 'base', label: t('apparence.textSize.base'), px: 21 },
                      { value: 'lg',   label: t('apparence.textSize.lg'),   px: 26 },
                    ] as const).map(opt => {
                      const active = textSize === opt.value;
                      return (
                        <button key={opt.value} onClick={() => setTextSize(opt.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                            active ? 'border-primary-700 bg-primary-50' : 'border-dark-200 hover:border-primary-400 hover:bg-dark-50'
                          }`}>
                          <span className={`font-bold leading-none ${active ? 'text-primary-700' : 'text-dark-700'}`} style={{ fontSize: opt.px }}>Aa</span>
                          <p className={`font-semibold text-sm ${active ? 'text-primary-700' : 'text-dark-700'}`}>{opt.label}</p>
                          {active && <CheckCircle size={14} className="text-primary-700" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Couleur d'accent (base, libres) ── */}
                <div>
                  <h3 className="font-semibold text-dark-900 mb-1 flex items-center gap-2">
                    <Palette size={15} className="text-primary-700" /> {t('apparence.accentColor.title')}
                  </h3>
                  <p className="text-dark-500 text-xs mb-4">{t('apparence.accentColor.subtitle')}</p>
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
                        <span className="text-base">🎨</span> {t('apparence.specialThemes.title')}
                      </h3>
                      <p className="text-dark-500 text-xs mb-4">
                        {t('apparence.specialThemes.subtitle')}
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
                        <span className="text-base">✨</span> {t('apparence.eventThemes.title')}
                      </h3>
                      <p className="text-dark-500 text-xs mb-4">{t('apparence.eventThemes.subtitle')}</p>
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
                          {t('apparence.eventThemes.reset')}
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* ── Voix de l'assistant vocal ── */}
                <VoiceSettingsSection />

              </div>
            )}

            {tab === 'langue' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Langue de l'interface</h2>
                <div className="space-y-2">
                  {LANGS.map(({ code, flag, label, badge }) => (
                    <label key={code}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        locale === code
                          ? 'border-primary-700 bg-primary-50'
                          : 'border-dark-200 hover:border-primary-400'
                      } ${localePending ? 'opacity-60 pointer-events-none' : ''}`}>
                      <input
                        type="radio"
                        name="lang"
                        checked={locale === code}
                        onChange={() => switchLocale(code)}
                        className="accent-primary-700"
                      />
                      <span className="text-lg leading-none">{flag}</span>
                      <span className="w-8 h-6 rounded bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">{badge}</span>
                      <span className="font-medium text-dark-700">{label}</span>
                      {locale === code && <CheckCircle size={16} className="ml-auto text-primary-700" />}
                    </label>
                  ))}
                </div>
                <p className="text-dark-400 text-xs mt-4">La langue choisie est enregistrée sur votre compte et réappliquée à chaque visite.</p>
              </div>
            )}

            {tab === 'aide' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Aide & Support</h2>
                <div className="space-y-3">
                  {HELP_ITEMS.map(({ Icon, text, href }) => (
                    <Link key={href} href={href}
                      className="flex items-center gap-3 p-4 rounded-xl border border-dark-200 hover:border-primary-400 hover:bg-primary-50 transition-colors group">
                      <div className="w-9 h-9 bg-dark-50 group-hover:bg-primary-100 rounded-xl flex items-center justify-center transition-colors shrink-0">
                        <Icon size={16} className="text-dark-500 group-hover:text-primary-700 transition-colors" />
                      </div>
                      <span className="font-medium text-dark-700 flex-1">{text}</span>
                      <ArrowRight size={15} className="text-dark-300 group-hover:text-primary-700 transition-colors shrink-0" />
                    </Link>
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
