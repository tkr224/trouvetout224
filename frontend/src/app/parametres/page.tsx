'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Lock, Bell, Shield, Globe, HelpCircle, FileText, Info, LogOut } from 'lucide-react';
import Link from 'next/link';

const TABS = [
  { key:'profil', label:'Profil', icon:User },
  { key:'securite', label:'Sécurité & Mot de passe', icon:Lock },
  { key:'notifications', label:'Notifications', icon:Bell },
  { key:'confidentialite', label:'Confidentialité', icon:Shield },
  { key:'langue', label:'Langue', icon:Globe },
  { key:'aide', label:'Aide & Support', icon:HelpCircle },
  { key:'conditions', label:"Conditions d'utilisation", icon:FileText },
  { key:'apropos', label:'À propos', icon:Info },
];

export default function ParametresPage() {
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState('profil');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bio, setBio] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [notifMsg, setNotifMsg] = useState(true);
  const [notifAnnonce, setNotifAnnonce] = useState(true);
  const [notifVue, setNotifVue] = useState(false);

  const saveProfile = async () => {
    try { await api.put('/users/me', { firstName, lastName, bio }); toast.success('Profil mis à jour !'); }
    catch { toast.error('Erreur de mise à jour'); }
  };

  const changePwd = async () => {
    if (!currentPwd || !newPwd) return toast.error('Remplissez tous les champs');
    try { await api.put('/auth/change-password', { currentPassword: currentPwd, newPassword: newPwd }); toast.success('Mot de passe changé !'); setCurrentPwd(''); setNewPwd(''); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary-700' : 'bg-dark-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold text-dark-900 mb-6">⚙️ Paramètres</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card p-2 h-fit space-y-0.5">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary-700 text-white' : 'text-dark-600 hover:bg-dark-50'}`}>
                <t.icon size={16} />{t.label}
              </button>
            ))}
            <div className="pt-2 border-t border-dark-100 mt-2">
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={16} />Déconnexion
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 card p-6">
            {tab === 'profil' && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-dark-900 text-lg mb-5">Modifier le profil</h2>
                <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-2xl mb-2">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-700">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900">{user?.firstName} {user?.lastName}</p>
                    <button className="text-primary-700 text-sm hover:underline mt-1">Changer la photo de profil</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold text-dark-700 mb-1.5">Prénom</label><input value={firstName} onChange={e => setFirstName(e.target.value)} className="input" /></div>
                  <div><label className="block text-sm font-semibold text-dark-700 mb-1.5">Nom</label><input value={lastName} onChange={e => setLastName(e.target.value)} className="input" /></div>
                </div>
                <div><label className="block text-sm font-semibold text-dark-700 mb-1.5">Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Parlez de vous en quelques mots..." className="input resize-none" /></div>
                <button onClick={saveProfile} className="btn-primary px-8">Sauvegarder les modifications</button>
              </div>
            )}

            {tab === 'securite' && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-dark-900 text-lg mb-5">Sécurité du compte</h2>
                <div className="p-4 bg-primary-50 rounded-2xl border border-primary-200 mb-4">
                  <p className="text-primary-800 text-sm font-medium">✅ Compte actif et sécurisé</p>
                </div>
                <div><label className="block text-sm font-semibold text-dark-700 mb-1.5">Mot de passe actuel</label><input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" className="input" /></div>
                <div><label className="block text-sm font-semibold text-dark-700 mb-1.5">Nouveau mot de passe</label><input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimum 6 caractères" className="input" /></div>
                <button onClick={changePwd} className="btn-primary px-8">Changer le mot de passe</button>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-dark-900 text-lg mb-5">Préférences de notifications</h2>
                {[
                  { label:'Nouveaux messages', sub:'Être notifié quand vous recevez un message', value: notifMsg, fn: () => setNotifMsg(!notifMsg) },
                  { label:'Expiration d\'annonce', sub:'Rappel avant que votre annonce expire', value: notifAnnonce, fn: () => setNotifAnnonce(!notifAnnonce) },
                  { label:'Nouvelles vues', sub:'Quand quelqu\'un consulte vos annonces', value: notifVue, fn: () => setNotifVue(!notifVue) },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-dark-50 rounded-2xl">
                    <div><p className="font-semibold text-dark-900 text-sm">{n.label}</p><p className="text-dark-500 text-xs mt-0.5">{n.sub}</p></div>
                    <Toggle value={n.value} onChange={n.fn} />
                  </div>
                ))}
              </div>
            )}

            {tab === 'langue' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg mb-5">Langue de l'interface</h2>
                <div className="space-y-2">
                  {[['fr','🇫🇷 Français (défaut)'],['en','🇬🇧 English'],['ar','🇸🇦 العربية']].map(([code, label]) => (
                    <label key={code} className="flex items-center gap-3 p-4 rounded-xl border-2 border-dark-200 hover:border-primary-400 cursor-pointer has-[:checked]:border-primary-700 has-[:checked]:bg-primary-50 transition-colors">
                      <input type="radio" name="lang" defaultChecked={code === 'fr'} className="accent-primary-700" />
                      <span className="font-medium text-dark-700">{label}</span>
                      {code === 'fr' && <span className="ml-auto text-xs text-primary-700 font-medium">Actuelle</span>}
                    </label>
                  ))}
                </div>
                <p className="text-dark-400 text-xs mt-4">Les traductions en anglais et arabe seront disponibles prochainement.</p>
              </div>
            )}

            {tab === 'aide' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg mb-5">Aide & Support</h2>
                <div className="space-y-3">
                  {[
                    ['❓', "Comment publier une annonce ?", '/aide/publier'],
                    ['💳', 'Comment payer avec Orange Money ?', '/aide/paiement'],
                    ['🔒', 'Comment signaler un problème ?', '/aide/signalement'],
                    ['📝', 'Comment publier une annonce ?', '/aide/publier'],
                    ['📧', 'Contacter le support', '/contact'],
                  ].map(([icon, text, href]) => (
                    <a key={href} href={href} className="flex items-center gap-3 p-4 rounded-xl border border-dark-200 hover:border-primary-400 hover:bg-primary-50 transition-colors group">
                      <span className="text-2xl">{icon}</span>
                      <span className="font-medium text-dark-700 flex-1">{text}</span>
                      <span className="text-dark-400 group-hover:text-primary-700 transition-colors">→</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {tab === 'conditions' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg mb-5">Conditions d'utilisation</h2>
                <div className="prose prose-sm text-dark-600 space-y-4">
                  <p>En utilisant TrouveTout224, vous acceptez les présentes conditions.</p>
                  <div><h3 className="font-semibold text-dark-800">1. Utilisation du service</h3><p>TrouveTout224 est une plateforme d'annonces destinée aux résidents de Guinée. L'âge minimum est de 13 ans.</p></div>
                  <div><h3 className="font-semibold text-dark-800">2. Contenu interdit</h3><p>Il est strictement interdit de publier du contenu illégal, offensant, des arnaques, de la nudité ou de la violence.</p></div>
                  <div><h3 className="font-semibold text-dark-800">3. Responsabilité</h3><p>TrouveTout224 n'est pas responsable des transactions entre utilisateurs. Soyez vigilants et rencontrez les vendeurs dans des lieux publics.</p></div>
                  <div><h3 className="font-semibold text-dark-800">4. Paiements</h3><p>Les paiements Premium (10 000 GNF) sont non remboursables une fois validés.</p></div>
                </div>
              </div>
            )}

            {tab === 'confidentialite' && (
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg mb-5">Confidentialité</h2>
                <div className="space-y-4">
                  {[
                    { label:'Profil public', sub:'Votre profil est visible par tous les utilisateurs', value: true },
                    { label:'Afficher mon numéro', sub:'Votre numéro est visible sur vos annonces', value: true },
                    { label:'Recevoir des messages', sub:'Les autres utilisateurs peuvent vous contacter', value: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-dark-50 rounded-2xl">
                      <div><p className="font-semibold text-dark-900 text-sm">{item.label}</p><p className="text-dark-500 text-xs mt-0.5">{item.sub}</p></div>
                      <button className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? 'bg-primary-700' : 'bg-dark-300'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
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
                <p className="text-dark-400 text-sm mb-6">Version 1.0.0 · Conakry, République de Guinée 🇬🇳</p>
                <p className="text-dark-600 max-w-md mx-auto text-sm leading-relaxed mb-6">
                  La plus grande plateforme d'annonces et marketplace de Guinée. Notre mission est de connecter acheteurs et vendeurs partout en Guinée.
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6 text-center">
                  <div className="bg-primary-50 rounded-xl p-3"><p className="text-xl font-bold text-primary-700">21</p><p className="text-xs text-dark-500">Catégories</p></div>
                  <div className="bg-primary-50 rounded-xl p-3"><p className="text-xl font-bold text-primary-700">8</p><p className="text-xs text-dark-500">Villes</p></div>
                  <div className="bg-primary-50 rounded-xl p-3"><p className="text-xl font-bold text-primary-700">🇬🇳</p><p className="text-xs text-dark-500">Guinée</p></div>
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
