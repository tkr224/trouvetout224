'use client';
import { useEffect, useState } from 'react';
import { Tag, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type Category = {
  id: string;
  name: string;
  nameFr: string;
  slug: string;
  icon: string;
  color?: string;
  isActive: boolean;
  order: number;
  _count?: { annonces: number };
};

type FormData = {
  name: string;
  nameFr: string;
  slug: string;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
};

const EMPTY: FormData = {
  name: '',
  nameFr: '',
  slug: '',
  icon: '📦',
  color: '#16a34a',
  isActive: true,
  order: 0,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      nameFr: cat.nameFr,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color || '#16a34a',
      isActive: cat.isActive,
      order: cat.order,
    });
    setEditing(cat.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.nameFr || !form.slug) {
      toast.error('Le nom et le slug sont requis');
      return;
    }
    try {
      if (editing) {
        const res = await api.put(`/admin/categories/${editing}`, form);
        setCategories(c => c.map(x => x.id === editing ? { ...x, ...res.data.data } : x));
        toast.success('Catégorie mise à jour');
      } else {
        const res = await api.post('/admin/categories', form);
        setCategories(c => [...c, { ...res.data.data, _count: { annonces: 0 } }]);
        toast.success('Catégorie créée');
      }
      setShowForm(false);
    } catch { toast.error('Erreur lors de la sauvegarde'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ? Les annonces liées seront affectées.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories(c => c.filter(x => x.id !== id));
      toast.success('Catégorie supprimée');
    } catch { toast.error('Impossible de supprimer (des annonces y sont peut-être liées)'); }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await api.put(`/admin/categories/${cat.id}`, {
        name: cat.name,
        nameFr: cat.nameFr,
        icon: cat.icon,
        color: cat.color,
        isActive: !cat.isActive,
        order: cat.order,
      });
      setCategories(c => c.map(x => x.id === cat.id ? { ...x, isActive: !cat.isActive } : x));
    } catch { toast.error('Erreur'); }
  };

  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Catégories</h1>
          <p className="text-dark-400 text-sm mt-1">
            {categories.length} catégorie{categories.length > 1 ? 's' : ''} configurée{categories.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-premium"
        >
          <Plus size={16} /> Nouvelle catégorie
        </button>
      </div>

      {/* Modale de formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-dark-900">
                {editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dark-100 text-dark-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Nom technique', key: 'name' as const, placeholder: 'electronics' },
                { label: 'Nom en français *', key: 'nameFr' as const, placeholder: 'Électronique' },
                { label: 'Slug (URL) *', key: 'slug' as const, placeholder: 'electronique' },
                { label: 'Icône (emoji)', key: 'icon' as const, placeholder: '📦' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-dark-600 mb-1">{f.label}</label>
                  <input
                    value={form[f.key] as string}
                    onChange={e => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  />
                </div>
              ))}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-dark-600 mb-1">Couleur</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setField('color', e.target.value)}
                    className="h-10 w-full rounded-xl border border-dark-200 cursor-pointer px-1 py-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-dark-600 mb-1">Ordre</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={e => setField('order', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              {/* Toggle active */}
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <button
                  type="button"
                  onClick={() => setField('isActive', !form.isActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                    form.isActive ? 'bg-primary-600' : 'bg-dark-300'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                      form.isActive ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-dark-700">Catégorie active</span>
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 bg-dark-100 hover:bg-dark-200 text-dark-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={save}
                className="flex-1 px-4 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {editing ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grille */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-9 h-9 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 ${
                !cat.isActive ? 'opacity-55' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${cat.color || '#16a34a'}1a` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-dark-900 truncate">{cat.nameFr}</p>
                    <p className="text-dark-400 text-xs truncate">{cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(cat)}
                    title={cat.isActive ? 'Désactiver' : 'Activer'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      cat.isActive
                        ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        : 'bg-dark-100 text-dark-400 hover:bg-dark-200'
                    }`}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => remove(cat.id)}
                    className="p-1.5 rounded-lg bg-guinea-50 text-guinea-500 hover:bg-guinea-100 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-dark-400">
                  {cat._count?.annonces || 0} annonce{(cat._count?.annonces || 0) > 1 ? 's' : ''}
                </span>
                <span
                  className={`badge ${
                    cat.isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-dark-100 text-dark-500'
                  }`}
                >
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full text-center py-20 text-dark-400">
              <Tag size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucune catégorie</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
