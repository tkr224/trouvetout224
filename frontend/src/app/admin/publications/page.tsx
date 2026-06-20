'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Megaphone, Plus, Pencil, Trash2, X, Loader2, Image as ImageIcon,
  Calendar, MapPin, Link2, Star, Eye, EyeOff, ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type PubType = 'BANNER' | 'EVENT' | 'FEATURED_VENDOR';

type Publication = {
  id: string;
  type: PubType;
  title: string;
  subtitle?: string;
  image?: string;
  imagePublicId?: string;
  description?: string;
  link?: string;
  eventDate?: string;
  eventLocation?: string;
  isActive: boolean;
  endsAt?: string;
  order: number;
  createdAt: string;
};

type FormData = {
  type: PubType;
  title: string;
  subtitle: string;
  image: string;
  imagePublicId: string;
  description: string;
  link: string;
  eventDate: string;
  eventLocation: string;
  isActive: boolean;
  endsAt: string;
  order: number;
};

const EMPTY: FormData = {
  type: 'BANNER',
  title: '',
  subtitle: '',
  image: '',
  imagePublicId: '',
  description: '',
  link: '',
  eventDate: '',
  eventLocation: '',
  isActive: true,
  endsAt: '',
  order: 0,
};

const TYPE_CFG: Record<PubType, { label: string; color: string; bg: string; desc: string }> = {
  BANNER:          { label: 'Bannière / Promo',      color: 'text-primary-700 bg-primary-100', bg: 'bg-primary-700',  desc: 'Promotion, annonce générale, nouveauté' },
  EVENT:           { label: 'Événement',             color: 'text-blue-700 bg-blue-100',       bg: 'bg-blue-700',     desc: 'Foire, concert, marché, concours...' },
  FEATURED_VENDOR: { label: 'Vendeur en vedette',    color: 'text-gold-600 bg-gold-100',       bg: 'bg-amber-600',    desc: 'Mettre en avant un vendeur ou une boutique' },
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminPublications() {
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/publications');
      setPubs(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };

  const openEdit = (pub: Publication) => {
    setForm({
      type: pub.type,
      title: pub.title,
      subtitle: pub.subtitle || '',
      image: pub.image || '',
      imagePublicId: pub.imagePublicId || '',
      description: pub.description || '',
      link: pub.link || '',
      eventDate: pub.eventDate ? pub.eventDate.slice(0, 16) : '',
      eventLocation: pub.eventLocation || '',
      isActive: pub.isActive,
      endsAt: pub.endsAt ? pub.endsAt.slice(0, 10) : '',
      order: pub.order,
    });
    setEditing(pub.id);
    setShowForm(true);
  };

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(p => ({ ...p, [key]: val }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(p => ({ ...p, image: res.data.url, imagePublicId: res.data.publicId }));
      toast.success('Image uploadée !');
    } catch {
      toast.error('Erreur upload image');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const save = async () => {
    if (!form.title) { toast.error('Le titre est requis'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        subtitle: form.subtitle || null,
        image: form.image || null,
        imagePublicId: form.imagePublicId || null,
        description: form.description || null,
        link: form.link || null,
        eventDate: form.eventDate || null,
        eventLocation: form.eventLocation || null,
        endsAt: form.endsAt || null,
      };
      if (editing) {
        const res = await api.put(`/admin/publications/${editing}`, payload);
        setPubs(p => p.map(x => x.id === editing ? res.data.data : x));
        toast.success('Publication mise à jour');
      } else {
        const res = await api.post('/admin/publications', payload);
        setPubs(p => [res.data.data, ...p]);
        toast.success('Publication créée !');
      }
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette publication ?')) return;
    try {
      await api.delete(`/admin/publications/${id}`);
      setPubs(p => p.filter(x => x.id !== id));
      toast.success('Publication supprimée');
    } catch { toast.error('Erreur'); }
  };

  const toggleActive = async (pub: Publication) => {
    try {
      const res = await api.put(`/admin/publications/${pub.id}`, { ...pub, isActive: !pub.isActive });
      setPubs(p => p.map(x => x.id === pub.id ? res.data.data : x));
    } catch { toast.error('Erreur'); }
  };

  const now = new Date();

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
            <Megaphone className="text-primary-700" size={24} /> Publications officielles
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Bannières, événements et vendeurs en vedette affichés sur la page d&apos;accueil
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-premium"
        >
          <Plus size={16} /> Nouvelle publication
        </button>
      </div>

      {/* Modale formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-fadeIn max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-dark-900">
                {editing ? 'Modifier' : 'Nouvelle publication'}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dark-100 text-dark-400">
                <X size={18} />
              </button>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-2">Type <span className="text-guinea-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(TYPE_CFG) as [PubType, typeof TYPE_CFG[PubType]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => set('type', key)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      form.type === key
                        ? 'border-primary-700 bg-primary-50'
                        : 'border-dark-200 hover:border-dark-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-dark-900 leading-tight">{cfg.label}</p>
                    <p className="text-[10px] text-dark-400 mt-1 leading-tight hidden sm:block">{cfg.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">Titre <span className="text-guinea-500">*</span></label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="ex : Soldes de rentrée !"
                className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            {/* Sous-titre */}
            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">Sous-titre <span className="text-dark-400 font-normal">(optionnel)</span></label>
              <input
                value={form.subtitle}
                onChange={e => set('subtitle', e.target.value)}
                placeholder="ex : Jusqu'à -50% sur l'électronique"
                className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            {/* Description (pour événements / vedettes) */}
            {(form.type === 'EVENT' || form.type === 'FEATURED_VENDOR') && (
              <div>
                <label className="block text-xs font-semibold text-dark-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={3}
                  placeholder="Décrivez l'événement ou le vendeur..."
                  className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>
            )}

            {/* Champs spécifiques Événement */}
            {form.type === 'EVENT' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-600 mb-1">
                    <Calendar size={11} className="inline mr-1" />Date & heure
                  </label>
                  <input
                    type="datetime-local"
                    value={form.eventDate}
                    onChange={e => set('eventDate', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-600 mb-1">
                    <MapPin size={11} className="inline mr-1" />Lieu
                  </label>
                  <input
                    value={form.eventLocation}
                    onChange={e => set('eventLocation', e.target.value)}
                    placeholder="ex : Conakry, Hamdallaye"
                    className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Image */}
            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">Image</label>
              <div className="flex gap-2 items-center">
                {form.image ? (
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-dark-200">
                    <img src={form.image} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => set('image', '')}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-14 rounded-xl border-2 border-dashed border-dark-200 flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={20} className="text-dark-300" />
                  </div>
                )}
                <div className="flex-1">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImg}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dark-200 rounded-xl text-sm text-dark-600 hover:border-primary-400 hover:text-primary-700 transition-colors"
                  >
                    {uploadingImg
                      ? <><Loader2 size={14} className="animate-spin" /> Envoi…</>
                      : <><ImageIcon size={14} /> {form.image ? 'Changer l\'image' : 'Ajouter une image'}</>}
                  </button>
                  <p className="text-[10px] text-dark-400 mt-1 text-center">JPG, PNG, WebP · max 10 Mo</p>
                </div>
              </div>
            </div>

            {/* Lien */}
            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">
                <Link2 size={11} className="inline mr-1" />Lien <span className="text-dark-400 font-normal">(optionnel)</span>
              </label>
              <input
                value={form.link}
                onChange={e => set('link', e.target.value)}
                placeholder="ex : /profil/abc123 ou https://..."
                className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            {/* Date de fin + Ordre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-dark-600 mb-1">Date de fin <span className="text-dark-400 font-normal">(auto-désactivation)</span></label>
                <input
                  type="date"
                  value={form.endsAt}
                  onChange={e => set('endsAt', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-600 mb-1">Ordre d&apos;affichage</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={e => set('order', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.isActive ? 'bg-primary-600' : 'bg-dark-300'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="text-sm font-medium text-dark-700">Publication active (visible sur le site)</span>
            </label>

            {/* Boutons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-dark-100 hover:bg-dark-200 text-dark-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={save}
                disabled={saving || uploadingImg}
                className="flex-1 px-4 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving
                  ? <><Loader2 size={15} className="animate-spin" /> En cours…</>
                  : editing ? 'Enregistrer' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-9 h-9 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pubs.length === 0 ? (
        <div className="text-center py-24 text-dark-400">
          <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-dark-600">Aucune publication</p>
          <p className="text-sm mt-1">Créez votre première bannière, événement ou mise en vedette</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pubs.map(pub => {
            const cfg = TYPE_CFG[pub.type];
            const expired = pub.endsAt ? new Date(pub.endsAt) < now : false;
            return (
              <div
                key={pub.id}
                className={`bg-white rounded-2xl shadow-card p-4 flex items-center gap-4 ${!pub.isActive || expired ? 'opacity-60' : ''}`}
              >
                {/* Miniature */}
                <div className={`w-16 h-12 rounded-xl flex-shrink-0 overflow-hidden ${cfg.bg} flex items-center justify-center`}>
                  {pub.image
                    ? <img src={pub.image} alt="" className="w-full h-full object-cover" />
                    : <Megaphone size={22} className="text-white/70" />}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`badge text-[10px] ${cfg.color}`}>{cfg.label}</span>
                    {expired && <span className="badge bg-guinea-100 text-guinea-600 text-[10px]">Expirée</span>}
                    {!pub.isActive && !expired && <span className="badge bg-dark-100 text-dark-500 text-[10px]">Désactivée</span>}
                  </div>
                  <p className="font-semibold text-dark-900 text-sm truncate">{pub.title}</p>
                  <div className="flex items-center gap-3 text-dark-400 text-xs mt-0.5 flex-wrap">
                    {pub.eventDate && <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(pub.eventDate)}</span>}
                    {pub.endsAt && <span className="flex items-center gap-1"><ChevronDown size={10} />Expire le {formatDate(pub.endsAt)}</span>}
                    {pub.link && <span className="flex items-center gap-1"><Link2 size={10} />Lien</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(pub)}
                    title={pub.isActive ? 'Désactiver' : 'Activer'}
                    className={`p-2 rounded-lg transition-colors ${pub.isActive ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' : 'bg-dark-100 text-dark-400 hover:bg-dark-200'}`}
                  >
                    {pub.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => openEdit(pub)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(pub.id)}
                    className="p-2 rounded-lg bg-guinea-50 text-guinea-500 hover:bg-guinea-100 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
