'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { COLOR_THEMES, SPECIAL_THEMES } from '@/components/providers/ThemeProvider';
import { CheckCircle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminThemesPage() {
  const [globalTheme, setGlobalTheme]   = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [preview, setPreview]           = useState<string | null>(null);

  useEffect(() => {
    api.get('/site-config/theme')
      .then(r => { setGlobalTheme(r.data.globalTheme); setPreview(r.data.globalTheme); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveTheme = async (theme: string | null) => {
    setSaving(true);
    try {
      const r = await api.put('/site-config/theme', { globalTheme: theme });
      setGlobalTheme(r.data.globalTheme);
      setPreview(r.data.globalTheme);
      toast.success(theme ? `Thème "${theme}" activé pour tout le site` : 'Thème global désactivé');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-primary-700" />
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-fadeIn">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900">Gestion des thèmes</h1>
        <p className="text-dark-400 text-sm mt-1">
          Activez un thème pour tout le site. Les utilisateurs peuvent toujours choisir le leur dans leurs paramètres.
        </p>
      </div>

      {/* Thème actuellement actif */}
      <div className={`rounded-2xl p-5 flex items-center gap-4 border-2 ${
        globalTheme
          ? 'bg-primary-50 border-primary-200'
          : 'bg-dark-50 border-dark-200'
      }`}>
        <div>
          <p className="text-sm font-semibold text-dark-700">Thème global actif</p>
          <p className="text-lg font-bold text-dark-900 mt-0.5">
            {globalTheme
              ? ([...COLOR_THEMES, ...SPECIAL_THEMES].find(t => t.id === globalTheme)?.label ?? globalTheme)
              : 'Aucun — chaque utilisateur voit son propre thème'}
          </p>
        </div>
        {globalTheme && (
          <button
            onClick={() => saveTheme(null)}
            disabled={saving}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-dark-200 text-dark-600 hover:text-guinea-700 hover:border-guinea-400 transition-colors text-sm font-semibold"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Désactiver
          </button>
        )}
      </div>

      {/* Couleurs de base */}
      <div>
        <h2 className="font-display font-bold text-dark-900 text-base mb-4 border-l-4 border-primary-700 pl-3">
          Couleurs de base
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {COLOR_THEMES.map(ct => {
            const active = globalTheme === ct.id;
            const isPreviewed = preview === ct.id;
            return (
              <div
                key={ct.id}
                className={`rounded-2xl border-2 p-4 transition-all ${
                  active ? 'border-primary-700 bg-primary-50' : 'border-dark-200 bg-white hover:border-dark-400'
                }`}
              >
                <div className="flex flex-col items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full shadow-sm" style={{ backgroundColor: ct.hex }} />
                  <p className="text-xs font-semibold text-dark-800 text-center">{ct.emoji} {ct.label}</p>
                  {active && <CheckCircle size={14} className="text-primary-700" />}
                </div>
                <button
                  onClick={() => saveTheme(ct.id)}
                  disabled={saving || active}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-primary-100 text-primary-700 cursor-default'
                      : 'bg-dark-100 text-dark-600 hover:bg-primary-100 hover:text-primary-700'
                  }`}
                >
                  {active ? 'Actif' : 'Activer'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thèmes spéciaux */}
      <div>
        <h2 className="font-display font-bold text-dark-900 text-base mb-1 border-l-4 border-primary-700 pl-3">
          Thèmes spéciaux & événementiels
        </h2>
        <p className="text-dark-500 text-sm mb-4 pl-4">
          Ajoutent une couleur d&apos;ambiance + une banderole décorative en haut de chaque page du site.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SPECIAL_THEMES.map(st => {
            const active = globalTheme === st.id;
            return (
              <div
                key={st.id}
                className={`rounded-2xl border-2 p-5 transition-all ${
                  active ? 'border-primary-700 bg-primary-50' : 'border-dark-200 bg-white hover:border-dark-400'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: st.hex + '22' }}>
                    {st.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-dark-900 text-sm">{st.label}</p>
                    {active && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary-700 font-semibold">
                        <CheckCircle size={11} /> Actif
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-dark-500 text-xs mb-3">{st.description}</p>
                <button
                  onClick={() => saveTheme(st.id)}
                  disabled={saving || active}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-primary-100 text-primary-700 cursor-default'
                      : 'bg-dark-100 text-dark-600 hover:bg-primary-100 hover:text-primary-700'
                  }`}
                >
                  {active ? 'Actuellement actif' : 'Activer pour tout le site'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div className="bg-dark-50 rounded-2xl p-5 text-sm text-dark-600 border border-dark-200">
        <p className="font-semibold text-dark-800 mb-1">ℹ️ Comment ça fonctionne ?</p>
        <ul className="space-y-1 list-disc list-inside text-dark-500">
          <li>Le thème global s&apos;applique à tous les visiteurs du site qui n&apos;ont pas choisi leur propre thème.</li>
          <li>Les utilisateurs qui ont déjà personnalisé leur couleur dans leurs <strong>Paramètres → Apparence</strong> gardent leur choix.</li>
          <li>Le changement est instantané — pas besoin de redémarrer quoi que ce soit.</li>
        </ul>
      </div>
    </div>
  );
}
