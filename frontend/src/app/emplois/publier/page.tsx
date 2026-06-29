'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, ChevronLeft, Send, Info } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CITIES = ['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'];

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Temps plein' },
  { value: 'PART_TIME', label: 'Temps partiel' },
  { value: 'DAILY', label: 'Journalier' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Stage' },
  { value: 'VOLUNTEER', label: 'Bénévolat' },
];

const SECTORS = [
  { value: 'VENTE', label: 'Commerce & Vente' },
  { value: 'RESTAURATION', label: 'Restauration & Hôtellerie' },
  { value: 'BTP', label: 'BTP & Construction' },
  { value: 'BUREAUTIQUE', label: 'Bureau & Administration' },
  { value: 'CHAUFFEUR', label: 'Transport & Chauffeur' },
  { value: 'SECURITE', label: 'Sécurité & Gardiennage' },
  { value: 'SANTE', label: 'Santé & Social' },
  { value: 'EDUCATION', label: 'Éducation & Formation' },
  { value: 'INFORMATIQUE', label: 'Informatique & Tech' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function PublierEmploiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    sector: '',
    cityId: '',
    neighborhood: '',
    type: 'FULL_TIME',
    description: '',
    experience: '',
    education: '',
    salary: '',
    salaryMax: '',
    salaryNegotiable: false,
    phone: '',
    whatsapp: '',
    email: '',
    deadline: '',
    howToApply: '',
    schedule: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.cityId || !form.description) {
      toast.error('Remplissez les champs obligatoires (titre, entreprise, ville, description).');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/jobs', form);
      const isDirectPublish = res.data.data?.status === 'ACTIVE';
      toast.success(isDirectPublish
        ? 'Offre publiée directement ! Votre compte vérifié vous donne accès à la publication immédiate.'
        : 'Offre soumise ! Elle sera visible après validation par notre équipe.');
      router.push('/emplois');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erreur lors de la publication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-1.5 text-sm text-dark-400 mb-6">
          <Link href="/" className="hover:text-primary-700 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/emplois" className="hover:text-primary-700 transition-colors">Emplois</Link>
          <span>/</span>
          <span className="text-dark-700 font-medium">Publier une offre</span>
        </nav>

        <div className="bg-white rounded-2xl border border-dark-100 p-7 shadow-card">
          <div className="flex items-center gap-3 mb-7 pb-5 border-b border-dark-100">
            <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center">
              <Briefcase size={22} className="text-sky-700" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-dark-900">Publier une offre d'emploi</h1>
              <p className="text-dark-400 text-sm mt-0.5">Visible après validation par notre équipe (sous 24h)</p>
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-sm text-sky-800">
            <Info size={15} className="shrink-0 mt-0.5" />
            <p>Les champs marqués <span className="text-red-500 font-semibold">*</span> sont obligatoires. Votre offre sera vérifiée avant publication.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Infos principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  Titre du poste <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="ex: Caissier(ère), Chauffeur, Ingénieur Informatique..."
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  Entreprise / Employeur <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.company} onChange={e => set('company', e.target.value)}
                  placeholder="Nom de l'entreprise ou 'Particulier'"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  Secteur / Métier
                </label>
                <select value={form.sector} onChange={e => set('sector', e.target.value)} className="input w-full">
                  <option value="">-- Choisir un secteur --</option>
                  {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  Type de contrat <span className="text-red-500">*</span>
                </label>
                <select value={form.type} onChange={e => set('type', e.target.value)} className="input w-full">
                  {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  Horaires / Planning
                </label>
                <input
                  value={form.schedule} onChange={e => set('schedule', e.target.value)}
                  placeholder="ex: 8h–17h, Lundi–Vendredi"
                  className="input w-full"
                />
              </div>
            </div>

            {/* Lieu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  <MapPin size={13} className="inline mr-1 text-dark-400" />
                  Ville <span className="text-red-500">*</span>
                </label>
                <select value={form.cityId} onChange={e => set('cityId', e.target.value)} className="input w-full" required>
                  <option value="">-- Choisir une ville --</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Quartier / Zone</label>
                <input
                  value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)}
                  placeholder="ex: Kaloum, Ratoma, Centre-ville..."
                  className="input w-full"
                />
              </div>
            </div>

            {/* Salaire */}
            <div className="bg-dark-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-dark-700">Salaire (optionnel)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-dark-500 mb-1">Salaire minimum (GNF/mois)</label>
                  <input
                    type="number" value={form.salary} onChange={e => set('salary', e.target.value)}
                    placeholder="ex: 5000000"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-500 mb-1">Salaire maximum (GNF/mois)</label>
                  <input
                    type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)}
                    placeholder="ex: 10000000"
                    className="input w-full"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={form.salaryNegotiable}
                  onChange={e => set('salaryNegotiable', e.target.checked)}
                  className="w-4 h-4 accent-sky-600"
                />
                <span className="text-sm text-dark-600">Salaire à négocier</span>
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Description du poste <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Décrivez les missions, responsabilités, avantages..."
                rows={6}
                className="input w-full resize-y"
                required
              />
            </div>

            {/* Profil recherché */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Expérience requise</label>
                <input
                  value={form.experience} onChange={e => set('experience', e.target.value)}
                  placeholder="ex: 2 ans, Débutant accepté"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Niveau d'études</label>
                <input
                  value={form.education} onChange={e => set('education', e.target.value)}
                  placeholder="ex: BAC+2, Licence, Sans diplôme"
                  className="input w-full"
                />
              </div>
            </div>

            {/* Comment postuler */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Comment postuler ?</label>
              <textarea
                value={form.howToApply} onChange={e => set('howToApply', e.target.value)}
                placeholder="ex: Envoyez votre CV par WhatsApp, Présentez-vous au bureau..."
                rows={3}
                className="input w-full resize-none"
              />
            </div>

            {/* Contact */}
            <div className="bg-dark-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-dark-700">Contact de l'employeur</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-dark-500 mb-1">Téléphone</label>
                  <input
                    value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="6XX XX XX XX"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-500 mb-1">WhatsApp</label>
                  <input
                    value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                    placeholder="6XX XX XX XX"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-500 mb-1">Email</label>
                  <input
                    type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="email@exemple.com"
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Date limite de candidature</label>
              <input
                type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                className="input"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/emplois"
                className="flex items-center gap-1.5 px-5 py-2.5 border border-dark-200 rounded-xl text-dark-700 hover:bg-dark-50 text-sm font-medium transition-colors"
              >
                <ChevronLeft size={15} /> Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                <Send size={15} />
                {loading ? 'Publication...' : 'Soumettre l\'offre'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
