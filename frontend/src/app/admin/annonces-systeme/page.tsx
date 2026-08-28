'use client';
import { useEffect, useState } from 'react';
import { Radio, Plus, X, Loader2, Eye, EyeOff, Trash2, Link2, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type Announcement = {
  id: string;
  title: string;
  message: string;
  buttonText: string | null;
  buttonLink: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  _count: { views: number };
};

type FormData = {
  title: string;
  message: string;
  buttonText: string;
  buttonLink: string;
  expiresAt: string;
};

const EMPTY: FormData = { title: '', message: '', buttonText: '', buttonLink: '', expiresAt: '' };

function isExpired(a: Announcement): boolean {
  return !!a.expiresAt && new Date(a.expiresAt) < new Date();
}

export default function AdminSystemAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system-announcements');
      setItems(res.data.data);
    } catch {
      toast.error('Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Titre et message sont requis.');
      return;
    }
    if (form.buttonLink.trim() && !form.buttonText.trim()) {
      toast.error('Ajoute un texte de bouton si tu renseignes un lien.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/system-announcements', {
        title: form.title.trim(),
        message: form.message.trim(),
        buttonText: form.buttonText.trim() || undefined,
        buttonLink: form.buttonLink.trim() || undefined,
        expiresAt: form.expiresAt || undefined,
      });
      toast.success('Annonce système publiée — elle apparaîtra à la prochaine visite des utilisateurs connectés.');
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: Announcement) => {
    setTogglingId(item.id);
    try {
      await api.put(`/admin/system-announcements/${item.id}`, { isActive: !item.isActive });
      setItems(prev => prev.map(a => a.id === item.id ? { ...a, isActive: !a.isActive } : a));
      toast.success(item.isActive ? 'Annonce désactivée.' : 'Annonce réactivée.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer définitivement cette annonce système ?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/system-announcements/${id}`);
      setItems(prev => prev.filter(a => a.id !== id));
      toast.success('Annonce supprimée.');
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Radio className="text-primary-600" size={22} />
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900">Annonces système</h1>
            <p className="text-sm text-dark-500">Pop-up de diffusion visible par tous les utilisateurs connectés.</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nouvelle annonce
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-dark-300" size={28} /></div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-dark-400">
          <Radio className="mx-auto mb-3 opacity-40" size={32} />
          Aucune annonce système pour l'instant.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const expired = isExpired(item);
            const status = !item.isActive ? 'Désactivée' : expired ? 'Expirée' : 'Active';
            const statusColor = !item.isActive
              ? 'bg-dark-100 text-dark-500'
              : expired
                ? 'bg-gold-100 text-gold-700'
                : 'bg-primary-100 text-primary-700';
            return (
              <div key={item.id} className="card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-dark-900 truncate">{item.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>{status}</span>
                    </div>
                    <p className="text-sm text-dark-600 line-clamp-2">{item.message}</p>
                    <div className="flex items-center gap-4 flex-wrap mt-2 text-xs text-dark-400">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {item._count.views} vue{item._count.views > 1 ? 's' : ''}</span>
                      {item.expiresAt && (
                        <span className="flex items-center gap-1">
                          {expired ? 'Expirée le' : 'Expire le'} {new Date(item.expiresAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {item.buttonLink && (
                        <span className="flex items-center gap-1 truncate max-w-[220px]">
                          <Link2 size={12} /> {item.buttonText} → {item.buttonLink}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleActive(item)}
                      disabled={togglingId === item.id}
                      title={item.isActive ? 'Désactiver' : 'Réactiver'}
                      className="p-1.5 rounded-lg bg-dark-50 text-dark-500 hover:bg-dark-100 transition-colors disabled:opacity-50"
                    >
                      {togglingId === item.id ? <Loader2 size={16} className="animate-spin" /> : item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      disabled={deletingId === item.id}
                      title="Supprimer"
                      className="p-1.5 rounded-lg bg-guinea-50 text-guinea-500 hover:bg-guinea-100 transition-colors disabled:opacity-50"
                    >
                      {deletingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowForm(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark-900">Nouvelle annonce système</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-dark-50">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Titre</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Découvre Ibkek, notre nouvel assistant IA !"
                  maxLength={100}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Décris la nouveauté en quelques phrases..."
                  maxLength={500}
                  rows={4}
                  className="input resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                    Texte du bouton <span className="text-dark-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    value={form.buttonText}
                    onChange={e => setForm({ ...form, buttonText: e.target.value })}
                    placeholder="Découvrir"
                    maxLength={40}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                    Lien du bouton <span className="text-dark-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    value={form.buttonLink}
                    onChange={e => setForm({ ...form, buttonLink: e.target.value })}
                    placeholder="/aide ou https://..."
                    disabled={form.buttonLink === '#chat'}
                    className="input disabled:opacity-50"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-dark-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.buttonLink === '#chat'}
                  onChange={e => setForm({ ...form, buttonLink: e.target.checked ? '#chat' : '' })}
                  className="rounded"
                />
                Ouvrir directement le chat Ibkek au clic (au lieu d'un lien)
              </label>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  Date d'expiration <span className="text-dark-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-dark-200 text-dark-600 font-medium hover:bg-dark-50 transition-colors">
                Annuler
              </button>
              <button onClick={submit} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin" />} Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
