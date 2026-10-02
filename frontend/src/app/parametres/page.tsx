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
  Camera, AtSign, XCircle, Phone, Type, Clock, MessageCircle, MapPin, Wand2,
  ChevronLeft, ChevronRight, Sparkles, PartyPopper,
} from 'lucide-react';
import { useTheme, COLOR_THEMES, SPECIAL_THEMES } from '@/components/providers/ThemeProvider';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import BackButton from '@/components/BackButton';
import VoiceSettingsSection from '@/components/settings/VoiceSettingsSection';
import { isNotificationSoundEnabled, setNotificationSoundEnabled } from '@/lib/notificationSound';
import SavedAddressesSection from '@/components/settings/SavedAddressesSection';
import ActiveSessionsSection from '@/components/settings/ActiveSessionsSection';
import AccountSwitcherSection from '@/components/settings/AccountSwitcherSection';
import PersonalizationSection from '@/components/settings/PersonalizationSection';
import { SettingsCard, ToggleRow, tileClass, primaryBtn, secondaryBtn, linkBtn } from '@/components/settings/SettingsUI';
import Link from 'next/link';

const TAB_HREFS = [
  { key: 'profil',          icon: User },
  { key: 'adresses',        icon: MapPin },
  { key: 'securite',        icon: Lock },
  { key: 'notifications',   icon: Bell },
  { key: 'confidentialite', icon: Shield },
  { key: 'personnalisation', icon: Wand2 },
  { key: 'apparence',       icon: Palette },
  { key: 'langue',          icon: Globe },
  { key: 'aide',            icon: HelpCircle },
  { key: 'conditions',      icon: FileText },
  { key: 'apropos',         icon: Info },
] as const;

// Regroupement visuel de la sidebar (desktop) — ne change ni les clés ni la logique des onglets
const TAB_GROUP_HREFS: { key: string; keys: string[] }[] = [
  { key: 'compte',      keys: ['profil', 'adresses', 'securite', 'confidentialite', 'personnalisation', 'notifications'] },
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

const PROTECTED_TABS = ['profil', 'adresses', 'securite', 'notifications', 'confidentialite', 'personnalisation'];

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
  // Mobile : liste des sections (comme les réglages d'un téléphone) puis une section
  // ouverte en « page » avec bouton retour. Sans effet sur desktop.
  const [mobileDetail, setMobileDetail] = useState(false);
  const openTab = (key: string) => {
    setTab(key);
    setMobileDetail(true);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) window.scrollTo({ top: 0 });
  };
  // Lien direct vers un onglet (ex : « Gérer » sous le fil d'accueil → ?tab=personnalisation)
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab');
    if (wanted && TAB_HREFS.some(tb => tb.key === wanted)) { setTab(wanted); setMobileDetail(true); }
  }, []);

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
  // Téléphone (ajout/modification, vérifié par code WhatsApp — voir savePhone plus bas)
  const [phoneInput, setPhoneInput]     = useState('');
  const [phoneSaving, setPhoneSaving]   = useState(false);
  const [phoneError, setPhoneError]     = useState('');
  // 'input' = saisie du numéro, 'code' = saisie du code WhatsApp reçu
  const [phoneStep, setPhoneStep]       = useState<'input' | 'code'>('input');
  const [phoneCode, setPhoneCode]       = useState('');
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneResendAt, setPhoneResendAt]   = useState<number>(0); // timestamp autorisant un renvoi
  const [phoneResendTick, setPhoneResendTick] = useState(0); // force le re-rendu du compte à rebours
  // Changement d'email
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailPwd, setEmailPwd]           = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError]     = useState('');
  const [emailChangeSent, setEmailChangeSent]       = useState(false);
  const [notifMsg, setNotifMsg]         = useState(true);
  const [notifAnnonce, setNotifAnnonce] = useState(true);
  const [notifVue, setNotifVue]         = useState(false);
  // Réglage son des notifications toast temps réel (voir GlobalNotificationToasts) —
  // local à l'appareil, pas besoin d'aller-retour backend pour un simple mute.
  const [notifSound, setNotifSound]     = useState(true);
  useEffect(() => { setNotifSound(isNotificationSoundEnabled()); }, []);
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

  // Étape 1 : envoie un code de vérification par WhatsApp (ne modifie rien en base
  // tant que le code n'a pas été confirmé, voir verifyPhoneCode ci-dessous).
  const sendPhoneCode = async () => {
    setPhoneError('');
    if (!/^6\d{8}$/.test(phoneInput)) {
      setPhoneError(t('profil.phoneInvalid'));
      return;
    }
    setPhoneSaving(true);
    try {
      await api.put('/users/me/phone/start-verification', { phone: phoneInput });
      setPhoneStep('code');
      setPhoneCode('');
      setPhoneResendAt(Date.now() + 30_000); // renvoi possible après 30s
      toast.success(t('toasts.phoneCodeSent'));
    } catch (e: any) {
      setPhoneError(e.response?.data?.error || t('securite.errors.phoneGeneric'));
    } finally {
      setPhoneSaving(false);
    }
  };

  // Étape 2 : confirme le code reçu — c'est cet appel qui enregistre réellement le
  // numéro en base avec phoneVerified: true.
  const verifyPhoneCode = async () => {
    setPhoneError('');
    if (!/^\d{4,6}$/.test(phoneCode)) {
      setPhoneError(t('profil.phoneInvalid'));
      return;
    }
    setPhoneVerifying(true);
    try {
      const { data } = await api.put('/users/me/phone/verify', { phone: phoneInput, code: phoneCode });
      setMeData((m: any) => ({ ...m, phone: data.data.phone, phoneVerified: true, phoneChangedAt: new Date().toISOString() }));
      setPhoneInput('');
      setPhoneCode('');
      setPhoneStep('input');
      toast.success(t('toasts.phoneVerified'));
    } catch (e: any) {
      setPhoneError(e.response?.data?.error || t('securite.errors.phoneGeneric'));
    } finally {
      setPhoneVerifying(false);
    }
  };

  const cancelPhoneVerification = () => {
    setPhoneStep('input');
    setPhoneCode('');
    setPhoneError('');
  };

  // Compte à rebours du bouton "Renvoyer le code" — un simple tick par seconde pour
  // re-rendre le composant tant que le délai n'est pas écoulé.
  useEffect(() => {
    if (phoneStep !== 'code' || Date.now() >= phoneResendAt) return;
    const timer = setInterval(() => setPhoneResendTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [phoneStep, phoneResendAt]);
  const phoneResendSecondsLeft = Math.max(0, Math.ceil((phoneResendAt - Date.now()) / 1000));
  void phoneResendTick; // sert uniquement à déclencher le re-rendu du compte à rebours

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

  const phoneCooldown = cooldownInfo(meData?.phoneChangedAt);
  const emailCooldown = cooldownInfo(meData?.emailChangedAt);
  const pwdCooldown   = cooldownInfo(meData?.passwordChangedAt);
  const sqCooldown    = cooldownInfo(meData?.securityQuestionsChangedAt);

  const currentTab = TABS.find(tb => tb.key === tab) ?? TABS[0];
  const L = 'block text-sm font-medium text-dark-700 mb-1.5';

  // Élément de menu (sidebar desktop) — même style que le menu de l'avatar
  const navItem = (tb: (typeof TABS)[number]) => {
    const isProtected = PROTECTED_TABS.includes(tb.key);
    return (
      <button key={tb.key} onClick={() => openTab(tb.key)}
        aria-current={tab === tb.key ? 'page' : undefined}
        className="settings-nav-item relative w-full flex items-center gap-2.5 h-10 px-3 rounded-lg text-sm text-left whitespace-nowrap transition-colors">
        <tb.icon size={16} strokeWidth={1.75} className="shrink-0" />
        <span className="flex-1 truncate">{tb.label}</span>
        {isProtected && !loggedIn && <Lock size={11} className="shrink-0 opacity-40" />}
      </button>
    );
  };

  const logoutOrLogin = (mobile: boolean) => loggedIn ? (
    <button onClick={logout}
      className={`w-full flex items-center gap-2.5 px-3 rounded-lg text-sm text-guinea-600 hover:bg-guinea-50 transition-colors ${mobile ? 'h-12 px-4' : 'h-10'}`}>
      <LogOut size={16} strokeWidth={1.75} className="shrink-0" /> {t('logout')}
    </button>
  ) : (
    <Link href="/auth/connexion"
      className={`w-full flex items-center gap-2.5 px-3 rounded-lg text-sm text-primary-700 hover:bg-primary-50 transition-colors ${mobile ? 'h-12 px-4' : 'h-10'}`}>
      <User size={16} strokeWidth={1.75} className="shrink-0" /> {t('login')}
    </Link>
  );

  return (
    <div className="settings-ui min-h-screen bg-dark-50 overflow-x-clip">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4">

        {/* ══ EN-TÊTE COMPACT ════════════════════════════════════════ */}
        <header className={`${mobileDetail ? 'hidden lg:flex' : 'flex'} items-center gap-2 pt-3 pb-4 sm:pt-4 sm:pb-5`}>
          <BackButton fallbackHref="/profil" className="!min-h-[40px] !min-w-[40px] !pr-2 !text-dark-400" />
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <Settings size={18} strokeWidth={1.75} className="text-primary-700" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-display font-semibold text-dark-900 leading-tight">{t('header.title')}</h1>
            <p className="text-dark-500 text-xs sm:text-sm truncate">{t('header.subtitle')}</p>
          </div>
        </header>

        {/* En-tête d'une section ouverte (mobile uniquement) */}
        {mobileDetail && (
          <header className="lg:hidden flex items-center gap-1 pt-2 pb-3">
            <button onClick={() => setMobileDetail(false)}
              className="inline-flex items-center gap-1 -ml-2 pl-1 pr-2 h-10 rounded-lg text-dark-500 hover:bg-dark-100 text-sm font-medium">
              <ChevronLeft size={18} /> {t('cards.mobileBack')}
            </button>
            <h1 className="ml-auto text-base font-semibold text-dark-900 truncate flex items-center gap-2">
              <currentTab.icon size={16} strokeWidth={1.75} className="text-primary-700 shrink-0" /> {currentTab.label}
            </h1>
          </header>
        )}

        <div className="lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-6 lg:items-start pb-10">

          {/* ══ MENU LATÉRAL (desktop) — collant au défilement ══════════════ */}
          <aside className="hidden lg:block sticky top-20 self-start">
            <nav className="bg-white border border-dark-200 rounded-2xl p-2">
              {TAB_GROUPS.map((group, gi) => (
                <div key={group.key} className={gi > 0 ? 'mt-3' : ''}>
                  <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold text-dark-400 uppercase tracking-[0.08em]">{group.label}</p>
                  {TABS.filter(tb => group.keys.includes(tb.key)).map(navItem)}
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-dark-100">{logoutOrLogin(false)}</div>
            </nav>
          </aside>

          {/* ══ LISTE DES SECTIONS (mobile) — comme les réglages d'un téléphone ══ */}
          {!mobileDetail && (
            <div className="lg:hidden space-y-4">
              {TAB_GROUPS.map(group => (
                <div key={group.key}>
                  <p className="px-1 pb-1.5 text-[11px] font-semibold text-dark-400 uppercase tracking-[0.08em]">{group.label}</p>
                  <div className="bg-white border border-dark-200 rounded-2xl divide-y divide-dark-100 overflow-hidden">
                    {TABS.filter(tb => group.keys.includes(tb.key)).map(tb => (
                      <button key={tb.key} onClick={() => openTab(tb.key)}
                        className="settings-row w-full flex items-center gap-3 h-12 px-4 text-left">
                        <tb.icon size={17} strokeWidth={1.75} className="text-primary-700 shrink-0" />
                        <span className="flex-1 text-sm text-dark-900 truncate">{tb.label}</span>
                        {PROTECTED_TABS.includes(tb.key) && !loggedIn && <Lock size={12} className="text-dark-400 shrink-0" />}
                        <ChevronRight size={16} className="text-dark-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-white border border-dark-200 rounded-2xl overflow-hidden">{logoutOrLogin(true)}</div>
            </div>
          )}

          {/* ══ CONTENU ════════════════════════════════════════════════ */}
          <main className={`${mobileDetail ? 'block' : 'hidden lg:block'} min-w-0 space-y-4`}>

            {/* Gate : onglets protégés sans compte */}
            {showGate && (
              <SettingsCard bodyClassName="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                  <Lock size={22} className="text-primary-700" />
                </div>
                <h3 className="font-semibold text-dark-900 text-base mb-1.5">{t('gate.title')}</h3>
                <p className="text-dark-500 text-sm mb-5 max-w-xs leading-relaxed">{t('gate.text')}</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Link href="/auth/connexion" className={primaryBtn}>{t('gate.login')}</Link>
                  <Link href="/auth/inscription" className={secondaryBtn}>{t('gate.createAccount')}</Link>
                </div>
                <p className="text-dark-400 text-xs mt-5">
                  {t('gate.appearanceNotePrefix')}<strong>{t('gate.appearanceNoteBold')}</strong>{t('gate.appearanceNoteSuffix')}
                </p>
              </SettingsCard>
            )}

            {/* ── PROFIL ─────────────────────────────────────────── */}
            {!showGate && tab === 'profil' && (
              <>
                <SettingsCard
                  icon={User}
                  title={t('cards.profil.title')}
                  description={t('cards.profil.desc')}
                  footer={
                    <button onClick={saveProfile} disabled={profileLoading} className={primaryBtn}>
                      {profileLoading && <Loader2 size={15} className="animate-spin" />}
                      {t('profil.save')}
                    </button>
                  }
                >
                  {/* Photo + identité — en premier */}
                  <div className="flex items-center gap-4">
                    <button type="button" className="relative group shrink-0 rounded-full" onClick={() => avatarInputRef.current?.click()} aria-label={t('profil.changePhoto')}>
                      <span className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700 text-xl overflow-hidden">
                        {avatarUploading
                          ? <Loader2 size={22} className="animate-spin text-primary-700" />
                          : (localAvatar || meData?.avatar)
                            ? <img src={localAvatar || meData.avatar} alt="" className="w-full h-full object-cover" />
                            : `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                      </span>
                      <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Camera size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <div className="min-w-0">
                      <p className="font-semibold text-dark-900 truncate">{user?.firstName} {user?.lastName}</p>
                      {meData?.username && <p className="text-dark-500 text-xs truncate">@{meData.username}</p>}
                      <button type="button" onClick={() => avatarInputRef.current?.click()} className={`${linkBtn} mt-1`}>
                        <Camera size={13} /> {t('profil.changePhoto')}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-dark-100 -mx-4 sm:-mx-5" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={L}>{t('profil.firstName')}</label>
                      <input value={firstName} onChange={e => setFirstName(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className={L}>{t('profil.lastName')}</label>
                      <input value={lastName} onChange={e => setLastName(e.target.value)} className="input" />
                    </div>
                  </div>

                  <div>
                    <label className={`${L} flex items-center gap-1.5`}>
                      <AtSign size={13} className="text-dark-400" /> {t('profil.username')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 text-sm pointer-events-none">@</span>
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
                    <label className={L}>{t('profil.bio')}</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                      placeholder={t('profil.bioPlaceholder')} className="input resize-none" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`${L} flex items-center gap-1.5`}>
                        <Mail size={13} className="text-dark-400" /> {t('profil.email')}
                      </label>
                      <input value={meData?.email || t('profil.emailNotSet')} disabled className="input cursor-not-allowed" />
                      <p className="text-xs text-dark-400 mt-1.5">
                        {t('profil.emailChangeHintPrefix')}<strong>{t('profil.emailChangeHintBold')}</strong>{t('profil.emailChangeHintSuffix')}
                      </p>
                    </div>
                    <div>
                      <label className={L}>{t('profil.city')}</label>
                      <select value={cityId} onChange={e => setCityId(e.target.value)} className="input">
                        <option value="">{t('profil.cityNotSet')}</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Téléphone — vérifié par un code envoyé sur WhatsApp avant d'être enregistré */}
                  <div>
                    <label className={`${L} flex items-center gap-1.5`}>
                      <Phone size={13} className="text-dark-400" /> {t('profil.phone')}
                    </label>
                    <p className="text-xs text-dark-500 mb-2">{t('profil.phoneHint')}</p>

                    {phoneCooldown ? (
                      <>
                        <input value={meData?.phone || ''} disabled className="input cursor-not-allowed" />
                        <p className="text-xs text-gold-700 bg-gold-50 border border-gold-200 rounded-lg px-3 py-2 mt-2 flex items-center gap-1.5">
                          <Clock size={12} className="shrink-0" /> {t('profil.cooldownGeneric', { days: phoneCooldown.days, plural: phoneCooldown.days > 1 ? 's' : '', date: phoneCooldown.dateStr })}
                        </p>
                      </>
                    ) : phoneStep === 'code' ? (
                      <>
                        <p className="text-sm text-dark-600 mb-3 flex items-start gap-1.5">
                          <MessageCircle size={14} className="text-green-600 shrink-0 mt-0.5" />
                          {t('profil.phoneCodeSentTo', { phone: phoneInput })}
                        </p>
                        <input
                          value={phoneCode}
                          onChange={e => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder={t('profil.phoneCodePlaceholder')}
                          inputMode="numeric"
                          autoFocus
                          className="input text-center text-lg tracking-[0.3em] font-semibold"
                        />
                        {phoneError && <p className="text-xs text-guinea-600 mt-1.5">{phoneError}</p>}
                        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                          <button onClick={verifyPhoneCode} disabled={phoneVerifying || !/^\d{4,6}$/.test(phoneCode)} className={linkBtn}>
                            {phoneVerifying && <Loader2 size={13} className="animate-spin" />}
                            {t('profil.phoneVerifyCode')}
                          </button>
                          <button onClick={sendPhoneCode} disabled={phoneSaving || phoneResendSecondsLeft > 0}
                            className="text-dark-500 text-sm hover:underline disabled:opacity-50 disabled:no-underline">
                            {phoneResendSecondsLeft > 0 ? t('profil.phoneResendCodeIn', { seconds: phoneResendSecondsLeft }) : t('profil.phoneResendCode')}
                          </button>
                          <button onClick={cancelPhoneVerification} className="text-dark-400 text-sm hover:underline">
                            {t('profil.phoneChangeNumber')}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {meData?.phone && (
                          <p className="text-sm text-dark-600 mb-2 flex items-center gap-2 flex-wrap">
                            {t('profil.phoneCurrent', { phone: '' })}<strong className="text-dark-900 font-medium">{meData.phone}</strong>
                            {meData.phoneVerified ? (
                              <span className="settings-badge"><ShieldCheck size={11} /> {t('profil.phoneVerifiedBadge')}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-700 bg-gold-50 px-2 py-1 rounded-full leading-none">
                                <XCircle size={11} /> {t('profil.phoneUnverifiedBadge')}
                              </span>
                            )}
                          </p>
                        )}
                        <div className="flex gap-2 flex-col sm:flex-row">
                          <div className="relative flex-1 min-w-0">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 text-sm pointer-events-none">+224</span>
                            <input
                              value={phoneInput}
                              onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 9))}
                              placeholder={t('profil.phonePlaceholder')}
                              className="input pl-14"
                            />
                          </div>
                          <button onClick={sendPhoneCode} disabled={phoneSaving || phoneInput.length !== 9} className={`${secondaryBtn} !h-11 justify-center shrink-0`}>
                            {phoneSaving ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                            {t('profil.phoneSendCode')}
                          </button>
                        </div>
                        {phoneError && <p className="text-xs text-guinea-600 mt-1.5">{phoneError}</p>}
                      </>
                    )}
                  </div>
                </SettingsCard>

                <AccountSwitcherSection />
              </>
            )}

            {/* ── ADRESSES ───────────────────────────────────────── */}
            {!showGate && tab === 'adresses' && <SavedAddressesSection cities={cities} />}

            {/* ── SÉCURITÉ ───────────────────────────────────────── */}
            {!showGate && tab === 'securite' && (
              <>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-primary-200 bg-primary-50">
                  <ShieldCheck size={16} className="text-primary-700 shrink-0" />
                  <p className="text-primary-800 text-sm">{t('securite.accountSecure')}</p>
                </div>

                <SettingsCard
                  icon={KeyRound}
                  title={hasPassword === false ? t('securite.setPassword') : t('securite.changePassword')}
                  description={hasPassword === false ? t('securite.googleAccountHint') : t('cards.password.desc')}
                  footer={hasPassword !== null && !(hasPassword && pwdCooldown) ? (
                    <div className="w-full flex items-center justify-between gap-3 flex-wrap">
                      {hasPassword ? (
                        <Link href="/auth/mot-de-passe-oublie" className="text-sm text-dark-500 hover:text-primary-700 hover:underline">
                          {t('securite.forgotPassword')}
                        </Link>
                      ) : <span />}
                      <button onClick={changePwd} disabled={pwdLoading} className={primaryBtn}>
                        {pwdLoading && <Loader2 size={15} className="animate-spin" />}
                        {hasPassword ? t('securite.changePassword') : t('securite.setPassword')}
                      </button>
                    </div>
                  ) : undefined}
                >
                  {hasPassword === null ? (
                    <p className="text-dark-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {t('securite.loading')}</p>
                  ) : hasPassword && pwdCooldown ? (
                    <p className="text-sm text-gold-700 bg-gold-50 border border-gold-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
                      <Clock size={14} className="shrink-0" />
                      {t('profil.cooldownPassword', { days: pwdCooldown.days, plural: pwdCooldown.days > 1 ? 's' : '', date: pwdCooldown.dateStr })}
                    </p>
                  ) : (
                    <>
                      {hasPassword && (
                        <div>
                          <label className={L}>{t('securite.currentPassword')}</label>
                          <div className="relative">
                            <input type={showPwdFields ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                              placeholder="••••••••" className="input pr-11" />
                            <button type="button" tabIndex={-1} onClick={() => setShowPwdFields(v => !v)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                              {showPwdFields ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={L}>{t('securite.newPassword')}</label>
                          <div className="relative">
                            <input type={showPwdFields ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                              placeholder={t('securite.newPasswordPlaceholder')} className="input pr-11" />
                            <button type="button" tabIndex={-1} onClick={() => setShowPwdFields(v => !v)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                              {showPwdFields ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={L}>{t('securite.confirmPassword')}</label>
                          <input type={showPwdFields ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                            placeholder={t('securite.confirmPasswordPlaceholder')} className="input" />
                        </div>
                      </div>
                      {newPwd && (
                        <div>
                          <div className="flex gap-1 mb-1.5">
                            {[0, 1, 2, 3].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                                i < pwdScore ? ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-primary-500'][pwdScore - 1] : 'bg-dark-200'
                              }`} />
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                            {pwdCriteriaState.map((c, i) => (
                              <span key={i} className={`flex items-center gap-1 text-[11px] ${c.met ? 'text-primary-600' : 'text-dark-400'}`}>
                                <CheckCircle size={10} className={c.met ? 'text-primary-500' : 'text-dark-300'} /> {c.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {pwdError && <p className="text-sm text-guinea-600 bg-guinea-50 rounded-lg px-3.5 py-2.5">{pwdError}</p>}
                    </>
                  )}
                </SettingsCard>

                {/* ── Adresse email ── */}
                <SettingsCard
                  icon={Mail}
                  title={t('securite.emailTitle')}
                  description={meData?.email ? <>{t('securite.emailCurrent', { email: '' })}<strong className="text-dark-700">{meData.email}</strong></> : t('securite.emailNone')}
                  footer={!emailCooldown && !emailChangeSent ? (
                    <button onClick={requestEmailChange} disabled={emailChangeLoading || !newEmailInput.trim()} className={primaryBtn}>
                      {emailChangeLoading && <Loader2 size={15} className="animate-spin" />}
                      {meData?.email ? t('securite.changeEmail') : t('securite.addEmail')}
                    </button>
                  ) : undefined}
                >
                  {emailCooldown ? (
                    <p className="text-sm text-gold-700 bg-gold-50 border border-gold-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
                      <Clock size={14} className="shrink-0" />
                      {t('profil.cooldownGeneric', { days: emailCooldown.days, plural: emailCooldown.days > 1 ? 's' : '', date: emailCooldown.dateStr })}
                    </p>
                  ) : emailChangeSent ? (
                    <p className="text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3.5 py-2.5">
                      {t('securite.emailSent', { email: newEmailInput.trim() })}
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={L}>{t('securite.newEmail')}</label>
                          <input type="email" value={newEmailInput} onChange={e => setNewEmailInput(e.target.value)}
                            placeholder={t('securite.newEmailPlaceholder')} className="input" />
                        </div>
                        {hasPassword && (
                          <div>
                            <label className={L}>{t('securite.currentPassword')}</label>
                            <input type="password" value={emailPwd} onChange={e => setEmailPwd(e.target.value)} placeholder="••••••••" className="input" />
                          </div>
                        )}
                      </div>
                      {emailChangeError && <p className="text-sm text-guinea-600 bg-guinea-50 rounded-lg px-3.5 py-2.5">{emailChangeError}</p>}
                      <p className="text-xs text-dark-400">{t('securite.emailChangeHint')}</p>
                    </>
                  )}
                </SettingsCard>

                {/* ── Questions de sécurité ── */}
                <SettingsCard
                  icon={HelpCircle}
                  title={t('securite.sqTitle')}
                  description={t('securite.sqHint')}
                  footer={sqEditing ? (
                    <>
                      <button onClick={() => setSqEditing(false)} className={secondaryBtn}>{t('securite.sqCancel')}</button>
                      <button onClick={saveSq} disabled={sqSaving} className={primaryBtn}>
                        {sqSaving && <Loader2 size={15} className="animate-spin" />} {t('securite.sqSave')}
                      </button>
                    </>
                  ) : undefined}
                >
                  {sqConfigured === null ? (
                    <p className="text-dark-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {t('securite.loading')}</p>
                  ) : !sqEditing ? (
                    sqConfigured.length >= 2 ? (
                      <div>
                        <p className="text-sm font-medium text-dark-900 flex items-center gap-2 mb-2">
                          <ShieldCheck size={15} className="text-primary-700" /> {t('securite.sqConfiguredCount', { count: sqConfigured.length })}
                        </p>
                        <ul className="text-dark-600 text-sm space-y-1 mb-3 list-disc list-inside">
                          {sqConfigured.map(q => <li key={q.questionId}>{tSecurity(`questions.${q.questionId}`)}</li>)}
                        </ul>
                        {sqCooldown ? (
                          <p className="text-xs text-gold-700 bg-gold-50 border border-gold-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                            <Clock size={12} className="shrink-0" /> {t('profil.cooldownGeneric', { days: sqCooldown.days, plural: sqCooldown.days > 1 ? 's' : '', date: sqCooldown.dateStr })}
                          </p>
                        ) : (
                          <button onClick={startEditSq} className={secondaryBtn}>{t('securite.sqEdit')}</button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-gold-200 bg-gold-50">
                        <Shield size={16} className="text-gold-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gold-800 text-sm font-medium mb-0.5">{t('securite.sqNoneTitle')}</p>
                          <p className="text-gold-700 text-xs mb-3">{t('securite.sqNoneHint')}</p>
                          <button onClick={startEditSq} className={primaryBtn}>{t('securite.sqConfigureNow')}</button>
                        </div>
                      </div>
                    )
                  ) : (
                    <>
                      {sqRows.map((row, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-dark-700">{t('securite.sqQuestionLabel', { n: i + 1 })}</label>
                            {sqRows.length > 2 && (
                              <button onClick={() => removeSqRow(i)} className="text-guinea-500 text-xs font-medium hover:underline">{t('securite.sqRemove')}</button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select value={row.questionId} onChange={e => updateSqRow(i, 'questionId', e.target.value)} className="input">
                              <option value="">{t('securite.sqChoosePlaceholder')}</option>
                              {sqMaster
                                .filter(q => q.id === row.questionId || !sqRows.some(r => r.questionId === q.id))
                                .map(q => <option key={q.id} value={q.id}>{tSecurity(`questions.${q.id}`)}</option>)}
                            </select>
                            <input value={row.answer} onChange={e => updateSqRow(i, 'answer', e.target.value)}
                              placeholder={t('securite.sqAnswerPlaceholder')} className="input" />
                          </div>
                        </div>
                      ))}
                      {sqRows.length < 3 && <button onClick={addSqRow} className={linkBtn}>{t('securite.sqAddThird')}</button>}
                      {sqError && <p className="text-sm text-guinea-600 bg-guinea-50 rounded-lg px-3.5 py-2.5">{sqError}</p>}
                      <p className="text-xs text-dark-400">{t('securite.sqFooterHint')}</p>
                    </>
                  )}
                </SettingsCard>

                <ActiveSessionsSection />
              </>
            )}

            {/* ── NOTIFICATIONS ──────────────────────────────────── */}
            {!showGate && tab === 'notifications' && (
              <SettingsCard icon={Bell} title={t('notifications.title')} description={t('cards.notifications.desc')} bodyClassName="divide-y divide-dark-100">
                {[
                  { label: t('notifications.newMessages.label'),    sub: t('notifications.newMessages.sub'),    value: notifMsg,     fn: () => setNotifMsg(!notifMsg) },
                  { label: t('notifications.annonceExpiry.label'),  sub: t('notifications.annonceExpiry.sub'),  value: notifAnnonce, fn: () => setNotifAnnonce(!notifAnnonce) },
                  { label: t('notifications.newViews.label'),       sub: t('notifications.newViews.sub'),       value: notifVue,     fn: () => setNotifVue(!notifVue) },
                  { label: t('notifications.sound.label'),          sub: t('notifications.sound.sub'),          value: notifSound,   fn: () => { const v = !notifSound; setNotifSound(v); setNotificationSoundEnabled(v); } },
                ].map((n, i) => <ToggleRow key={i} label={n.label} sub={n.sub} value={n.value} onClick={n.fn} />)}
              </SettingsCard>
            )}

            {/* ── CONFIDENTIALITÉ ────────────────────────────────── */}
            {!showGate && tab === 'confidentialite' && (
              <SettingsCard icon={Shield} title={t('confidentialite.title')} description={t('cards.confidentialite.desc')} bodyClassName="divide-y divide-dark-100">
                {[
                  { label: t('confidentialite.publicProfile.label'),   sub: t('confidentialite.publicProfile.sub'),   value: privPublic,   onChange: () => { const v = !privPublic;   setPrivPublic(v);   savePrivacy('profPublic', v); } },
                  { label: t('confidentialite.showPhone.label'),       sub: t('confidentialite.showPhone.sub'),       value: privPhone,    onChange: () => { const v = !privPhone;    setPrivPhone(v);    savePrivacy('showPhone', v); } },
                  { label: t('confidentialite.acceptMessages.label'), sub: t('confidentialite.acceptMessages.sub'), value: privMessages, onChange: () => { const v = !privMessages; setPrivMessages(v); savePrivacy('acceptMessages', v); } },
                ].map((item, i) => <ToggleRow key={i} label={item.label} sub={item.sub} value={item.value} onClick={item.onChange} />)}
              </SettingsCard>
            )}

            {/* ── PERSONNALISATION ───────────────────────────────── */}
            {!showGate && tab === 'personnalisation' && <PersonalizationSection />}

            {/* ── APPARENCE ──────────────────────────────────────── */}
            {tab === 'apparence' && (
              <>
                <SettingsCard icon={Monitor} title={t('apparence.title')} description={t('apparence.subtitle')}>
                  <div className="grid grid-cols-3 gap-2.5">
                    {([
                      // Aperçus en couleurs fixes (inline) : sinon le mode sombre global
                      // repeindrait aussi l'aperçu « Clair » en sombre.
                      { value: 'light',  label: t('apparence.modes.light.label'),  icon: Sun,     desc: t('apparence.modes.light.desc'),  preview: { background: '#ffffff', borderColor: '#e2e8f0', color: '#64748b' } },
                      { value: 'dark',   label: t('apparence.modes.dark.label'),   icon: Moon,    desc: t('apparence.modes.dark.desc'),   preview: { background: '#0f172a', borderColor: '#334155', color: '#94a3b8' } },
                      { value: 'system', label: t('apparence.modes.system.label'), icon: Monitor, desc: t('apparence.modes.system.desc'), preview: { background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 48%, #0f172a 52%, #0f172a 100%)', borderColor: '#94a3b8', color: '#64748b' } },
                    ] as const).map(opt => {
                      const Icon = opt.icon;
                      const active = theme === opt.value;
                      return (
                        <button key={opt.value} onClick={() => setTheme(opt.value)} aria-pressed={active} className={tileClass(active)}>
                          <span className="w-full h-10 rounded-lg border flex items-center justify-center" style={opt.preview}>
                            <Icon size={17} strokeWidth={1.75} />
                          </span>
                          <span className="font-medium text-sm">{opt.label}</span>
                          <span className="text-dark-400 text-[11px] text-center leading-tight hidden sm:block">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </SettingsCard>

                <SettingsCard icon={Type} title={t('apparence.textSize.title')} description={t('apparence.textSize.subtitle')}>
                  <div className="grid grid-cols-3 gap-2.5">
                    {([
                      { value: 'sm',   label: t('apparence.textSize.sm'),   px: 15 },
                      { value: 'base', label: t('apparence.textSize.base'), px: 19 },
                      { value: 'lg',   label: t('apparence.textSize.lg'),   px: 24 },
                    ] as const).map(opt => {
                      const active = textSize === opt.value;
                      return (
                        <button key={opt.value} onClick={() => setTextSize(opt.value)} aria-pressed={active} className={tileClass(active)}>
                          <span className="font-semibold leading-none h-7 flex items-end" style={{ fontSize: opt.px }}>Aa</span>
                          <span className="font-medium text-sm">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </SettingsCard>

                <SettingsCard icon={Palette} title={t('apparence.accentColor.title')} description={t('apparence.accentColor.subtitle')}>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {COLOR_THEMES.filter(ct => !ct.isSpecial).map(ct => {
                      const active = colorAccent === ct.id && !specialTheme;
                      return (
                        <button key={ct.id} onClick={() => setColorAccent(ct.id)} aria-pressed={active} className={tileClass(active)}>
                          <span className="w-7 h-7 rounded-full shadow-sm ring-2 ring-white/20" style={{ backgroundColor: ct.hex }} />
                          <span className="text-xs font-medium text-center leading-tight">{ct.emoji} {ct.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </SettingsCard>

                {/* Thèmes spéciaux animés (visibles seulement si débloqués) */}
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
                    <SettingsCard icon={Sparkles} title={t('apparence.specialThemes.title')} description={t('apparence.specialThemes.subtitle')}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {visibleSpecial.map(ct => {
                          const active = colorAccent === ct.id && !specialTheme;
                          return (
                            <button key={ct.id} onClick={() => setColorAccent(ct.id)} aria-pressed={active} className={tileClass(active)}>
                              <span className="w-7 h-7 rounded-full shadow-sm" style={{ backgroundColor: ct.hex }} />
                              <span className="text-xs font-medium text-center leading-tight">{ct.emoji} {ct.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </SettingsCard>
                  );
                })()}

                {/* Thèmes événementiels */}
                {(() => {
                  const visibleEvents = SPECIAL_THEMES.filter(st => !isThemeLocked(st.id));
                  if (visibleEvents.length === 0) return null;
                  return (
                    <SettingsCard
                      icon={PartyPopper}
                      title={t('apparence.eventThemes.title')}
                      description={t('apparence.eventThemes.subtitle')}
                      footer={specialTheme ? (
                        <button onClick={() => setSpecialTheme(null)} className={secondaryBtn}>{t('apparence.eventThemes.reset')}</button>
                      ) : undefined}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {visibleEvents.map(st => {
                          const active = specialTheme === st.id;
                          return (
                            <button key={st.id} onClick={() => setSpecialTheme(active ? null : st.id as any)} aria-pressed={active}
                              className={`${tileClass(active)} !flex-row !items-center !gap-3 text-left`}>
                              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: st.hex + '22' }}>
                                {st.emoji}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium">{st.label}</span>
                                <span className="block text-dark-400 text-xs leading-tight mt-0.5">{st.description}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </SettingsCard>
                  );
                })()}

                <VoiceSettingsSection />
              </>
            )}

            {/* ── LANGUE ─────────────────────────────────────────── */}
            {tab === 'langue' && (
              <SettingsCard icon={Globe} title={t('cards.langue.title')} description={t('cards.langue.desc')} bodyClassName="divide-y divide-dark-100">
                {LANGS.map(({ code, label, badge }) => (
                  <label key={code}
                    className={`settings-row flex items-center gap-3 px-4 sm:px-5 h-12 cursor-pointer ${localePending ? 'opacity-60 pointer-events-none' : ''}`}>
                    <input type="radio" name="lang" checked={locale === code} onChange={() => switchLocale(code)} className="accent-primary-700 w-4 h-4" />
                    <span className="w-8 text-center text-xs font-semibold text-dark-500">{badge}</span>
                    <span className={`text-sm ${locale === code ? 'font-semibold text-primary-700' : 'text-dark-800'}`}>{label}</span>
                    {locale === code && <CheckCircle size={15} className="ml-auto text-primary-700" />}
                  </label>
                ))}
              </SettingsCard>
            )}

            {/* ── AIDE ───────────────────────────────────────────── */}
            {tab === 'aide' && (
              <SettingsCard icon={HelpCircle} title={t('tabs.aide')} description={t('cards.aide.desc')} bodyClassName="divide-y divide-dark-100">
                {HELP_ITEMS.map(({ Icon, text, href }) => (
                  <Link key={href} href={href} className="settings-row flex items-center gap-3 px-4 sm:px-5 h-12 group">
                    <Icon size={16} strokeWidth={1.75} className="text-primary-700 shrink-0" />
                    <span className="text-sm text-dark-800 flex-1">{text}</span>
                    <ChevronRight size={15} className="text-dark-400 group-hover:text-primary-700 transition-colors shrink-0" />
                  </Link>
                ))}
              </SettingsCard>
            )}

            {/* ── CONDITIONS ─────────────────────────────────────── */}
            {tab === 'conditions' && (
              <SettingsCard icon={FileText} title={t('tabs.conditions')} description={t('cards.conditions.desc')}>
                <div className="text-sm text-dark-600 space-y-4 leading-relaxed">
                  <p>En utilisant TrouveTout224, vous acceptez les présentes conditions.</p>
                  <div>
                    <h3 className="font-semibold text-dark-900 mb-1">1. Utilisation du service</h3>
                    <p>TrouveTout224 est une plateforme d'annonces destinée aux résidents de Guinée. L'âge minimum est de 13 ans.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900 mb-1">2. Contenu interdit</h3>
                    <p>Il est strictement interdit de publier du contenu illégal, offensant, des arnaques, de la nudité ou de la violence.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900 mb-1">3. Responsabilité</h3>
                    <p>TrouveTout224 n'est pas responsable des transactions entre utilisateurs. Soyez vigilants et rencontrez les vendeurs dans des lieux publics.</p>
                  </div>
                </div>
              </SettingsCard>
            )}

            {/* ── À PROPOS ───────────────────────────────────────── */}
            {tab === 'apropos' && (
              <SettingsCard icon={Info} title={t('cards.apropos.title')} bodyClassName="text-center py-8 px-5">
                <div className="w-16 h-16 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-display font-bold text-xl">TT</span>
                </div>
                <h2 className="text-xl font-display font-bold mb-1">
                  <span className="text-primary-700">TrouveTout</span><span className="text-yellow-500">224</span>
                </h2>
                <p className="text-dark-400 text-sm mb-5">Version 1.0.0 · Conakry, République de Guinée</p>
                <p className="text-dark-600 max-w-md mx-auto text-sm leading-relaxed mb-6">
                  La plus grande plateforme d'annonces et marketplace de Guinée. Notre mission est de connecter acheteurs et vendeurs partout en Guinée.
                </p>
                <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto mb-6 text-center">
                  {[['21', 'Catégories'], ['8', 'Villes'], ['GN', 'Guinée']].map(([v, l]) => (
                    <div key={l} className="border border-dark-200 rounded-xl p-3">
                      <p className="text-lg font-semibold text-primary-700">{v}</p>
                      <p className="text-xs text-dark-500">{l}</p>
                    </div>
                  ))}
                </div>
                <p className="text-dark-400 text-xs">© {new Date().getFullYear()} TrouveTout224 · Tous droits réservés</p>
              </SettingsCard>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
