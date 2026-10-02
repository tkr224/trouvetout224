'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Plus, Pencil, Trash2, Star, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSavedAddresses, SavedAddress } from '@/hooks/useSavedAddresses';
import { SettingsCard, secondaryBtn } from './SettingsUI';

type CityOption = { id: string; name: string };

type FormState = { label: string; phone: string; cityId: string; neighborhood: string };
const EMPTY_FORM: FormState = { label: '', phone: '', cityId: '', neighborhood: '' };

export default function SavedAddressesSection({ cities }: { cities: CityOption[] }) {
  const t = useTranslations('parametres.adresses');
  const { addresses, loaded, create, update, remove, setDefault } = useSavedAddresses();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (a: SavedAddress) => {
    setEditingId(a.id);
    setForm({ label: a.label || '', phone: a.phone.replace('+224', ''), cityId: a.cityId, neighborhood: a.neighborhood || '' });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.phone.trim() || !form.cityId) {
      toast.error(t('toastRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: form.label.trim() || undefined,
        phone: form.phone.trim(),
        cityId: form.cityId,
        neighborhood: form.neighborhood.trim() || undefined,
      };
      if (editingId) await update(editingId, payload);
      else await create(payload);
      toast.success(t('toastSaved'));
      setShowForm(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('toastError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    try { await setDefault(id); } catch { toast.error(t('toastError')); }
    finally { setBusyId(null); }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    setBusyId(id);
    try { await remove(id); toast.success(t('toastDeleted')); }
    catch { toast.error(t('toastError')); }
    finally { setBusyId(null); }
  };

  return (
    <>
    <SettingsCard
      icon={MapPin}
      title={t('title')}
      description={t('hint')}
      bodyClassName="divide-y divide-dark-100"
      actions={
        <button onClick={openCreate} className={secondaryBtn}>
          <Plus size={15} /> {t('addBtn')}
        </button>
      }
    >
      {!loaded ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-dark-300" size={20} /></div>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-dark-400 px-4 sm:px-5 py-4">{t('empty')}</p>
      ) : (
        addresses.map(a => (
          <div key={a.id} className="settings-row flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 min-h-[56px]">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-dark-900 truncate">
                  {a.label || `${a.city.name}${a.neighborhood ? ` · ${a.neighborhood}` : ''}`}
                </p>
                {a.isDefault && <span className="settings-badge shrink-0">{t('defaultBadge')}</span>}
              </div>
              <p className="text-xs text-dark-500 truncate mt-0.5">
                {a.phone} · {a.city.name}{a.neighborhood ? ` · ${a.neighborhood}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {!a.isDefault && (
                <button onClick={() => handleSetDefault(a.id)} disabled={busyId === a.id} title={t('setDefaultBtn')} aria-label={t('setDefaultBtn')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-dark-400 hover:text-dark-700 hover:bg-dark-100 disabled:opacity-50">
                  <Star size={14} />
                </button>
              )}
              <button onClick={() => openEdit(a)} title={t('editBtn')} aria-label={t('editBtn')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-dark-400 hover:text-dark-700 hover:bg-dark-100">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleRemove(a.id)} disabled={busyId === a.id} title={t('deleteBtn')} aria-label={t('deleteBtn')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-guinea-500 hover:bg-guinea-50 disabled:opacity-50">
                {busyId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        ))
      )}
    </SettingsCard>

      {showForm && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowForm(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-dark-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark-900 dark:text-white">{editingId ? t('editTitle') : t('addTitle')}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-200 mb-1.5">
                  {t('labelField')} <span className="text-dark-400 font-normal">{t('optional')}</span>
                </label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder={t('labelPlaceholder')} maxLength={40} className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-200 mb-1.5">{t('phoneField')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 text-sm font-semibold pointer-events-none">+224</span>
                  <input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                    placeholder="620 00 00 00"
                    className="input pl-14"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-200 mb-1.5">{t('cityField')}</label>
                <select value={form.cityId} onChange={e => setForm({ ...form, cityId: e.target.value })} className="input">
                  <option value="">{t('cityPlaceholder')}</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-200 mb-1.5">
                  {t('neighborhoodField')} <span className="text-dark-400 font-normal">{t('optional')}</span>
                </label>
                <input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder={t('neighborhoodPlaceholder')} className="input" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 font-medium hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors">
                {t('cancelBtn')}
              </button>
              <button onClick={submit} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin" />} {t('saveBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
