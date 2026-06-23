'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  User, Lock, Bell, Shield, Globe, HelpCircle, FileText, Info, LogOut,
  Settings, CheckCircle, ArrowRight, Mail, CreditCard, ShieldCheck, Link2,
  Palette, Sun, Moon, Monitor,
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
  const { user, logout, isAuthenticated, _hasHydrated } = useAuthStore();
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
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
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

  const saveProfile = async () => {
    try { await api.put('/users/me', { firstName, lastName, bio }); toast.success('Profil mis à jour !'); }
    catch { toast.error('Erreur de mise à jour'); }
  };

  const savePrivacy = (key: string, val: boolean) => {
    const saved = localStorage.getItem('tt224-privacy');
    const current = saved ? JSON.parse(saved) : {};
    localStorage.setItem('tt224-privacy', JSON.stringify({ ...current, [key]: val }));
  };

  const changePwd = async () => {
    if (!currentPwd || !newPwd) return toast.error('Remplissez tous les champs');
    try {
      await api.put('/auth/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      toast.success('Mot de passe changé !');
      setCurrentPwd(''); setNewPwd('');
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-primary-700' : 'bg-dark-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
            <Settings size={18} className="text-primary-700" />
          </div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Paramètres</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar navigation */}
          <div className="bg-white rounded-2xl border border-dark-100 shadow-card p-2 h-fit space-y-0.5">
            {TABS.map(t => {
              const isProtected = PROTECTED_TABS.includes(t.key);
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    ${tab === t.key ? 'bg-primary-700 text-white shadow-sm' : 'text-dark-600 hover:bg-dark-50'}`}>
                  <t.icon size={15} className="shrink-0" />
                  <span className="flex-1 text-left">{t.label}</span>
                  {isProtected && !loggedIn && (
                    <Lock size={11} className="shrink-0 opacity-40" />
                  )}
                </button>
              );
            })}
            <div className="pt-2 border-t border-dark-100 mt-2">
              {loggedIn ? (
                <button onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={15} className="shrink-0" /> Déconnexion
                </button>
              ) : (
                <Link href="/auth/connexion"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors">
                  <User size={15} className="shrink-0" /> Se connecter
                </Link>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-dark-100 shadow-card p-6">

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
              <div className="space-y-4">
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Modifier le profil</h2>
                <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-2xl mb-2">
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center font-bold text-primary-700 text-xl">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900">{user?.firstName} {user?.lastName}</p>
                    <Link href="/profil" className="text-primary-700 text-sm hover:underline mt-1 inline-block">
                      Changer la photo de profil
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Prénom</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Nom</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    placeholder="Parlez de vous en quelques mots..." className="input resize-none" />
                </div>
                <button onClick={saveProfile} className="btn-primary px-8">Sauvegarder les modifications</button>
              </div>
            )}

            {!showGate && tab === 'securite' && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-dark-900 text-lg pl-2.5 border-l-2 border-primary-500 mb-5">Sécurité du compte</h2>
                <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border border-primary-200 mb-4">
                  <ShieldCheck size={18} className="text-primary-700 shrink-0" />
                  <p className="text-primary-800 text-sm font-medium">Compte actif et sécurisé</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Mot de passe actuel</label>
                  <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Nouveau mot de passe</label>
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimum 6 caractères" className="input" />
                </div>
                <button onClick={changePwd} className="btn-primary px-8">Changer le mot de passe</button>
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
                  <div key={i} className="flex items-center justify-between p-4 bg-dark-50 rounded-2xl">
                    <div>
                      <p className="font-semibold text-dark-900 text-sm">{n.label}</p>
                      <p className="text-dark-500 text-xs mt-0.5">{n.sub}</p>
                    </div>
                    <Toggle value={n.value} onChange={n.fn} />
                  </div>
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
                    <div key={i} className="flex items-center justify-between p-4 bg-dark-50 rounded-2xl">
                      <div>
                        <p className="font-semibold text-dark-900 text-sm">{item.label}</p>
                        <p className="text-dark-500 text-xs mt-0.5">{item.sub}</p>
                      </div>
                      <Toggle value={item.value} onChange={item.onChange} />
                    </div>
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
                  const visibleSpecial = COLOR_THEMES.filter(ct => ct.isSpecial && !isThemeLocked(ct.id));
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
                <p className="text-dark-400 text-xs">© 2024 TrouveTout224 · Tous droits réservés</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
