'use client';
import { useState } from 'react';
import { X, CheckCircle2, Loader2, ChevronRight, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const SOURCES = [
  'Facebook',
  'WhatsApp',
  'TikTok',
  'Un ami',
  'Recherche Google',
  'Autre',
];

const INTERESTS = [
  'Électronique',
  'Téléphones',
  'Véhicules',
  'Immobilier',
  'Mode & Vêtements',
  'Maison & Jardin',
  'Informatique',
  'Emplois',
  'Services',
  'Alimentation',
  'Sport & Loisirs',
  'Animaux',
];

interface Props {
  onClose: () => void;
}

export default function OnboardingSurvey({ onClose }: Props) {
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleInterest = (i: string) =>
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const markDone = () => {
    if (user) setUser({ ...user, onboardingDone: true });
    onClose();
  };

  const submit = async (skipped = false) => {
    setSaving(true);
    try {
      await api.post('/onboarding', {
        source: skipped ? null : source || null,
        interests: skipped ? [] : interests,
        city: skipped ? null : city.trim() || null,
        skipped,
      });
      if (!skipped) toast.success('Merci pour vos réponses !');
      markDone();
    } catch {
      toast.error('Erreur réseau, réessayez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md animate-fadeIn overflow-hidden">

        {/* En-tête */}
        <div className="relative bg-gradient-to-r from-primary-700 to-primary-800 px-6 pt-7 pb-5">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, #fbbf24 0%, transparent 50%)',
          }} />
          <button
            onClick={() => submit(true)}
            disabled={saving}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={16} />
          </button>
          <p className="text-primary-100 text-xs font-semibold uppercase tracking-widest mb-1">
            Bienvenue !
          </p>
          <h2 className="text-white font-display font-bold text-xl leading-snug">
            Parlez-nous de vous 🇬🇳
          </h2>
          <p className="text-primary-100 text-sm mt-1">
            3 petites questions · moins de 1 minute
          </p>

          {/* Indicateur de progression */}
          <div className="flex gap-1.5 mt-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                  i <= step ? 'bg-gold-400' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenu par étape */}
        <div className="px-6 py-5">

          {/* Étape 0 — Source */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="font-semibold text-dark-900 dark:text-white text-base">
                Comment avez-vous connu TrouveTout224 ?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SOURCES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                      source === s
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:border-dark-300'
                    }`}
                  >
                    {source === s && <CheckCircle2 size={13} className="inline mr-1.5 text-primary-600" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 1 — Intérêts (multi-sélection) */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="font-semibold text-dark-900 dark:text-white text-base">
                Qu&apos;est-ce qui vous intéresse le plus ?
              </p>
              <p className="text-dark-400 dark:text-dark-500 text-xs">Sélectionnez tout ce qui vous correspond</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => {
                  const active = interests.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleInterest(i)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                        active
                          ? 'border-primary-600 bg-primary-600 text-white shadow-premium'
                          : 'border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 hover:border-primary-400'
                      }`}
                    >
                      {active && <CheckCircle2 size={12} className="inline mr-1" />}
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Étape 2 — Ville */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="font-semibold text-dark-900 dark:text-white text-base">
                Vous êtes de quelle ville / quartier ?
              </p>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="ex : Conakry — Ratoma"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white placeholder-dark-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  autoFocus
                />
              </div>
              <p className="text-dark-400 dark:text-dark-500 text-xs">
                Cela nous aide à vous montrer les annonces proches de chez vous.
              </p>
            </div>
          )}
        </div>

        {/* Pied de modale — boutons */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={() => submit(true)}
            disabled={saving}
            className="flex-shrink-0 text-dark-400 dark:text-dark-500 text-sm hover:text-dark-600 dark:hover:text-dark-300 transition-colors disabled:opacity-50"
          >
            Passer
          </button>

          <div className="flex-1" />

          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-300 text-sm font-semibold hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
            >
              Retour
            </button>
          )}

          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-premium"
            >
              Suivant <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => submit(false)}
              disabled={saving}
              className="px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-premium disabled:opacity-70"
            >
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Envoi…</>
                : <>Terminer <CheckCircle2 size={15} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
