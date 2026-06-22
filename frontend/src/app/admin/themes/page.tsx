'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { COLOR_THEMES, SPECIAL_THEMES } from '@/components/providers/ThemeProvider';
import { CheckCircle, Loader2, X, Lock, Unlock, Search, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_SPECIAL_THEMES = [
  ...COLOR_THEMES.filter(t => t.isSpecial),
  ...SPECIAL_THEMES.map(t => ({ id: t.id, label: t.label, emoji: t.emoji, hex: t.hex, hexDark: t.hex })),
];

const BASE_THEMES = COLOR_THEMES.filter(t => !t.isSpecial);

interface UserAccess {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  themeAccesses?: { themeId: string }[];
}

export default function AdminThemesPage() {
  const [globalTheme, setGlobalTheme]         = useState<string | null>(null);
  const [siteSpecialThemes, setSiteSpecial]   = useState<string[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);

  // User access management
  const [searchQ, setSearchQ]                 = useState('');
  const [searchResults, setSearchResults]     = useState<UserAccess[]>([]);
  const [searching, setSearching]             = useState(false);
  const [selectedUser, setSelectedUser]       = useState<UserAccess | null>(null);
  const [grantingTheme, setGrantingTheme]     = useState<string | null>(null);

  useEffect(() => {
    api.get('/site-config/theme')
      .then(r => {
        setGlobalTheme(r.data.globalTheme);
        setSiteSpecial(r.data.siteSpecialThemes ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveGlobalTheme = async (theme: string | null) => {
    setSaving(true);
    try {
      const r = await api.put('/site-config/theme', { globalTheme: theme });
      setGlobalTheme(r.data.globalTheme);
      toast.success(theme ? `Thème "${theme}" activé pour tout le site` : 'Thème global désactivé');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const toggleSiteSpecial = async (themeId: string) => {
    const next = siteSpecialThemes.includes(themeId)
      ? siteSpecialThemes.filter(t => t !== themeId)
      : [...siteSpecialThemes, themeId];
    setSaving(true);
    try {
      const r = await api.put('/site-config/theme', { siteSpecialThemes: next });
      setSiteSpecial(r.data.siteSpecialThemes ?? next);
      toast.success(next.includes(themeId) ? `Thème "${themeId}" débloqué pour tous` : `Thème "${themeId}" reverrouillé`);
    } catch {
      toast.error('Erreur');
    } finally { setSaving(false); }
  };

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await api.get(`/admin/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(r.data);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(searchQ), 300);
    return () => clearTimeout(t);
  }, [searchQ, searchUsers]);

  const grantTheme = async (userId: string, themeId: string) => {
    setGrantingTheme(themeId);
    try {
      await api.post('/admin/theme-accesses', { userId, themeId });
      setSelectedUser(prev => prev ? {
        ...prev,
        themeAccesses: [...(prev.themeAccesses ?? []), { themeId }],
      } : prev);
      toast.success(`Thème "${themeId}" accordé !`);
    } catch { toast.error('Erreur'); }
    finally { setGrantingTheme(null); }
  };

  const revokeTheme = async (userId: string, themeId: string) => {
    setGrantingTheme(themeId);
    try {
      await api.delete(`/admin/theme-accesses/${userId}/${themeId}`);
      setSelectedUser(prev => prev ? {
        ...prev,
        themeAccesses: (prev.themeAccesses ?? []).filter(a => a.themeId !== themeId),
      } : prev);
      toast.success(`Accès "${themeId}" révoqué`);
    } catch { toast.error('Erreur'); }
    finally { setGrantingTheme(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-primary-700" />
    </div>
  );

  const userThemeIds = selectedUser?.themeAccesses?.map(a => a.themeId) ?? [];

  return (
    <div className="p-8 space-y-10 animate-fadeIn">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900">Gestion des thèmes</h1>
        <p className="text-dark-400 text-sm mt-1">
          Contrôlez les thèmes globaux, déverrouillez des thèmes pour tout le site ou pour des utilisateurs spécifiques.
        </p>
      </div>

      {/* Thème actuellement imposé */}
      <div className={`rounded-2xl p-5 flex items-center gap-4 border-2 ${
        globalTheme ? 'bg-primary-50 border-primary-200' : 'bg-dark-50 border-dark-200'
      }`}>
        <div>
          <p className="text-sm font-semibold text-dark-700">Thème global imposé</p>
          <p className="text-lg font-bold text-dark-900 mt-0.5">
            {globalTheme
              ? ([...COLOR_THEMES, ...SPECIAL_THEMES].find(t => t.id === globalTheme)?.label ?? globalTheme)
              : 'Aucun — chaque utilisateur voit son propre thème'}
          </p>
          <p className="text-dark-400 text-xs mt-0.5">Ce thème s'applique à tous les visiteurs sans préférence locale.</p>
        </div>
        {globalTheme && (
          <button onClick={() => saveGlobalTheme(null)} disabled={saving}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-dark-200 text-dark-600 hover:text-guinea-700 hover:border-guinea-400 transition-colors text-sm font-semibold">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Désactiver
          </button>
        )}
      </div>

      {/* Couleurs de base (imposer une couleur de base) */}
      <div>
        <h2 className="font-display font-bold text-dark-900 text-base mb-4 border-l-4 border-primary-700 pl-3">
          Imposer une couleur de base
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {BASE_THEMES.map(ct => {
            const active = globalTheme === ct.id;
            return (
              <div key={ct.id} className={`rounded-2xl border-2 p-4 transition-all ${
                active ? 'border-primary-700 bg-primary-50' : 'border-dark-200 bg-white hover:border-dark-400'
              }`}>
                <div className="flex flex-col items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full shadow-sm" style={{ backgroundColor: ct.hex }} />
                  <p className="text-xs font-semibold text-dark-800 text-center">{ct.emoji} {ct.label}</p>
                  {active && <CheckCircle size={14} className="text-primary-700" />}
                </div>
                <button onClick={() => saveGlobalTheme(ct.id)} disabled={saving || active}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
                    active ? 'bg-primary-100 text-primary-700 cursor-default'
                           : 'bg-dark-100 text-dark-600 hover:bg-primary-100 hover:text-primary-700'
                  }`}>
                  {active ? 'Actif' : 'Imposer'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thèmes spéciaux — débloquer pour tout le site */}
      <div>
        <h2 className="font-display font-bold text-dark-900 text-base mb-1 border-l-4 border-primary-700 pl-3">
          Thèmes spéciaux — débloqués pour tout le site
        </h2>
        <p className="text-dark-500 text-sm mb-4 pl-4">
          Les thèmes cochés ici sont accessibles à <strong>tous les utilisateurs</strong> sans accès individuel.
          Idéal pour des périodes festives (Noël, Ramadan…).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ALL_SPECIAL_THEMES.map(st => {
            const unlocked = siteSpecialThemes.includes(st.id);
            const imposing = globalTheme === st.id;
            return (
              <div key={st.id} className={`rounded-2xl border-2 p-4 transition-all ${
                unlocked ? 'border-primary-700 bg-primary-50' : 'border-dark-200 bg-white hover:border-dark-400'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: st.hex + '22' }}>
                    {st.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-dark-900 text-xs leading-tight">{st.label}</p>
                    {unlocked && <p className="text-primary-700 text-[10px] font-semibold mt-0.5">✓ Débloqué pour tous</p>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => toggleSiteSpecial(st.id)} disabled={saving}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                      unlocked
                        ? 'bg-primary-100 text-primary-700 hover:bg-red-50 hover:text-red-600'
                        : 'bg-dark-100 text-dark-600 hover:bg-primary-100 hover:text-primary-700'
                    }`}>
                    {unlocked ? <><Lock size={10} /> Reverrouiller</> : <><Unlock size={10} /> Débloquer</>}
                  </button>
                  <button onClick={() => saveGlobalTheme(imposing ? null : st.id)} disabled={saving}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-colors ${
                      imposing ? 'bg-amber-100 text-amber-700' : 'bg-dark-100 text-dark-500 hover:bg-amber-50 hover:text-amber-700'
                    }`} title={imposing ? 'Retirer le thème imposé' : 'Imposer ce thème à tous'}>
                    {imposing ? '★' : '☆'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accès individuels par utilisateur */}
      <div>
        <h2 className="font-display font-bold text-dark-900 text-base mb-1 border-l-4 border-primary-700 pl-3">
          Accès spéciaux par utilisateur
        </h2>
        <p className="text-dark-500 text-sm mb-5 pl-4">
          Accordez l&apos;accès à des thèmes spécifiques pour un utilisateur particulier.
        </p>

        {/* Recherche utilisateur */}
        <div className="relative mb-4 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Chercher un utilisateur..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="input pl-9 pr-4 py-2.5 text-sm"
          />
          {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 animate-spin" />}
        </div>

        {/* Résultats de recherche */}
        {searchResults.length > 0 && !selectedUser && (
          <div className="bg-white border border-dark-200 rounded-2xl shadow-card overflow-hidden mb-4 max-w-sm">
            {searchResults.map(u => (
              <button key={u.id} onClick={() => { setSelectedUser(u); setSearchResults([]); setSearchQ(''); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-colors text-left border-b border-dark-100 last:border-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-dark-800 text-sm">{u.firstName} {u.lastName}</p>
                  <p className="text-dark-400 text-xs">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {searchQ.length >= 2 && searchResults.length === 0 && !searching && (
          <p className="text-dark-400 text-sm mb-4">Aucun utilisateur trouvé.</p>
        )}

        {/* Panneau d'accès pour l'utilisateur sélectionné */}
        {selectedUser && (
          <div className="bg-white border border-dark-200 rounded-2xl shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold shrink-0">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </div>
                <div>
                  <p className="font-bold text-dark-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-dark-400 text-xs">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-dark-400 hover:text-dark-700">
                <X size={16} />
              </button>
            </div>

            <p className="text-dark-600 text-sm font-semibold">Thèmes spéciaux accessibles :</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_SPECIAL_THEMES.map(st => {
                const hasAccess = userThemeIds.includes(st.id) || siteSpecialThemes.includes(st.id);
                const isPersonal = userThemeIds.includes(st.id);
                const isSiteWide = siteSpecialThemes.includes(st.id) && !isPersonal;
                const isLoading  = grantingTheme === st.id;
                return (
                  <div key={st.id} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                    hasAccess ? 'border-primary-200 bg-primary-50' : 'border-dark-200 bg-dark-50'
                  }`}>
                    <span className="text-base shrink-0">{st.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-dark-800 truncate">{st.label}</p>
                      {isSiteWide && <p className="text-[10px] text-dark-400">Global</p>}
                    </div>
                    {isSiteWide ? (
                      <UserCheck size={13} className="text-primary-700 shrink-0" title="Accessible car débloqué pour tout le site" />
                    ) : (
                      <button
                        onClick={() => isPersonal
                          ? revokeTheme(selectedUser.id, st.id)
                          : grantTheme(selectedUser.id, st.id)
                        }
                        disabled={isLoading}
                        className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          isPersonal
                            ? 'bg-primary-700 text-white hover:bg-red-600'
                            : 'bg-dark-200 text-dark-500 hover:bg-primary-100 hover:text-primary-700'
                        }`}>
                        {isLoading ? <Loader2 size={10} className="animate-spin" /> :
                          isPersonal ? <CheckCircle size={11} /> : <Lock size={11} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Note explicative */}
      <div className="bg-dark-50 rounded-2xl p-5 text-sm text-dark-600 border border-dark-200">
        <p className="font-semibold text-dark-800 mb-2">ℹ️ Comment ça fonctionne ?</p>
        <ul className="space-y-1 list-disc list-inside text-dark-500">
          <li><strong>Thèmes de base</strong> : librement accessibles à tous les utilisateurs.</li>
          <li><strong>Thèmes spéciaux</strong> : verrouillés par défaut — débloquez-les site-wide ou par utilisateur.</li>
          <li><strong>Déblocage site-wide</strong> : rend le thème disponible pour tous pendant une période.</li>
          <li><strong>Accès individuel</strong> : accorde un thème précis à un utilisateur spécifique.</li>
          <li><strong>Thème imposé</strong> : force un thème sur tous les visiteurs sans préférence locale.</li>
        </ul>
      </div>
    </div>
  );
}
