'use client';
import { useEffect, useState } from 'react';
import {
  Radio, Plus, X, Loader2, Eye, EyeOff, Trash2, Link2, Clock, CheckCircle2, Bot, User, Sparkles,
  Pencil, Send, RefreshCw, MousePointerClick, GitCommit, Zap, ShieldCheck, History, AlertTriangle,
} from 'lucide-react';
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
  publishedAt: string | null;
  source: 'ADMIN' | 'AI';
  kind: 'MANUAL' | 'UPDATE';
  status: 'DRAFT' | 'PUBLISHED';
  version: string | null;
  deactivatedReason: string | null;
  sourceCommits: string[] | null;
  createdBy: { firstName: string; lastName: string } | null;
  clicks: number;
  _count: { views: number };
};

type Release = { id: string; version: string; status: string; attempts: number; lastError: string | null; commitCount: number; createdAt: string };
type Settings = { mode: 'AUTO' | 'VALIDATION'; releases: Release[]; currentVersion: string | null; aiAvailable: boolean; lifetimeDays: number };

type FormData = { title: string; message: string; buttonText: string; buttonLink: string; expiresAt: string };
const EMPTY: FormData = { title: '', message: '', buttonText: '', buttonLink: '', expiresAt: '' };

const RELEASE_LABEL: Record<string, { label: string; cls: string }> = {
  BASELINE:        { label: 'Référence',            cls: 'bg-dark-100 text-dark-600' },
  PENDING:         { label: 'En cours',             cls: 'bg-blue-100 text-blue-700' },
  FAILED:          { label: 'Échec (réessai auto)', cls: 'bg-guinea-100 text-guinea-700' },
  ANNOUNCED:       { label: 'Annoncée',             cls: 'bg-primary-100 text-primary-700' },
  DRAFTED:         { label: 'Brouillon prêt',       cls: 'bg-gold-100 text-gold-700' },
  NOTHING_VISIBLE: { label: 'Rien de visible',      cls: 'bg-dark-100 text-dark-500' },
  ROLLBACK:        { label: 'Retour en arrière',    cls: 'bg-orange-100 text-orange-700' },
};

const short = (v?: string | null) => (v || '').slice(0, 7);
const isExpired = (a: Announcement) => !!a.expiresAt && new Date(a.expiresAt) < new Date();

export default function AdminSystemAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [fromVersion, setFromVersion] = useState('');

  const load = async () => {
    try {
      const [list, st] = await Promise.all([api.get('/admin/system-announcements'), api.get('/admin/system-announcements/settings')]);
      setItems(list.data.data);
      setSettings(st.data.data);
    } catch {
      toast.error('Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const run = async (key: string, fn: () => Promise<any>, ok?: string) => {
    setBusy(key);
    try {
      const res = await fn();
      toast.success(res?.data?.message || ok || 'OK');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur.');
    } finally {
      setBusy(null);
    }
  };

  const setMode = (mode: Settings['mode']) => run('mode', () => api.put('/admin/system-announcements/settings', { mode }));

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({ title: a.title, message: a.message, buttonText: a.buttonText || '', buttonLink: a.buttonLink || '', expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : '' });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Titre et message sont requis.'); return; }
    if (form.buttonLink.trim() && !form.buttonText.trim()) { toast.error('Ajoute un texte de bouton si tu renseignes un lien.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), message: form.message.trim(),
        buttonText: form.buttonText.trim() || null, buttonLink: form.buttonLink.trim() || null,
        expiresAt: form.expiresAt || null,
      };
      if (editingId) await api.put(`/admin/system-announcements/${editingId}`, payload);
      else await api.post('/admin/system-announcements', payload);
      toast.success(editingId ? 'Annonce modifiée.' : 'Annonce publiée — elle apparaîtra à la prochaine visite des utilisateurs connectés.');
      setShowForm(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => {
    if (!window.confirm('Supprimer définitivement cette annonce système ?')) return;
    run(`del-${id}`, () => api.delete(`/admin/system-announcements/${id}`), 'Annonce supprimée.');
  };

  const drafts = items.filter(a => a.status === 'DRAFT');

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Radio className="text-primary-600" size={22} />
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900">Annonces système</h1>
            <p className="text-sm text-dark-500">Pop-up visible une seule fois par chaque utilisateur connecté.</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nouvelle annonce
        </button>
      </div>

      {/* ── Annonces de mise à jour automatiques ── */}
      {settings && (
        <div className="card p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-semibold text-dark-900 flex items-center gap-2"><Bot size={18} className="text-primary-700" /> Annonces de mise à jour par Ibkek</h2>
              <p className="text-sm text-dark-500 mt-1 max-w-2xl">
                À chaque nouvelle version en ligne, Ibkek lit les changements, garde uniquement ce qui est visible pour les utilisateurs et rédige le pop-up.
                Une seule annonce de mise à jour active à la fois, désactivée automatiquement après {settings.lifetimeDays} jours.
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-dark-200 p-1 bg-dark-50">
              {([
                { key: 'AUTO', label: 'Automatique', icon: Zap, hint: "L'IA publie directement" },
                { key: 'VALIDATION', label: 'Validation', icon: ShieldCheck, hint: "L'IA prépare un brouillon, tu valides" },
              ] as const).map(m => (
                <button key={m.key} onClick={() => settings.mode !== m.key && setMode(m.key)} disabled={busy === 'mode'} title={m.hint}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${settings.mode === m.key ? 'bg-white text-primary-700 shadow-sm' : 'text-dark-500 hover:text-dark-800'}`}>
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-xs text-dark-500">
            <span className="flex items-center gap-1"><GitCommit size={13} /> Version en ligne : <strong className="text-dark-700 font-mono">{short(settings.currentVersion) || 'inconnue'}</strong></span>
            <span className={`flex items-center gap-1 ${settings.aiAvailable ? 'text-primary-700' : 'text-guinea-600'}`}>
              {settings.aiAvailable ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} IA {settings.aiAvailable ? 'disponible' : 'non configurée sur ce serveur'}
            </span>
            <button onClick={() => run('check', () => api.post('/admin/system-announcements/check-release'))} disabled={busy === 'check'}
              className="flex items-center gap-1 font-semibold text-primary-700 hover:underline disabled:opacity-50">
              {busy === 'check' ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Vérifier maintenant
            </button>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); if (fromVersion.trim()) run('preview', () => api.post('/admin/system-announcements/check-release', { fromVersion: fromVersion.trim() })); }}
            className="flex items-center gap-2 flex-wrap text-sm"
          >
            <span className="text-dark-500">Préparer un brouillon avec les changements depuis la version</span>
            <input value={fromVersion} onChange={e => setFromVersion(e.target.value)} placeholder="ex : 726ec5f"
              className="input !w-32 !py-1.5 font-mono text-sm" />
            <button disabled={!fromVersion.trim() || busy === 'preview'} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dark-200 text-dark-700 font-medium hover:bg-dark-50 disabled:opacity-50">
              {busy === 'preview' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Préparer
            </button>
          </form>

          {settings.releases.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-dark-600 font-medium flex items-center gap-1.5"><History size={14} /> Versions détectées ({settings.releases.length})</summary>
              <ul className="mt-2 divide-y divide-dark-100 border border-dark-100 rounded-xl overflow-hidden">
                {settings.releases.map(r => {
                  const st = RELEASE_LABEL[r.status] || { label: r.status, cls: 'bg-dark-100 text-dark-600' };
                  return (
                    <li key={r.id} className="flex items-center gap-3 px-3 py-2 flex-wrap">
                      <span className="font-mono text-xs text-dark-700">{short(r.version)}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      <span className="text-xs text-dark-400">{r.commitCount} commit(s) · {new Date(r.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      {r.lastError && <span className="text-xs text-guinea-600 w-full sm:w-auto">{r.lastError}</span>}
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>
      )}

      {drafts.length > 0 && (
        <p className="text-sm text-gold-800 bg-gold-50 border border-gold-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Sparkles size={15} className="shrink-0" /> {drafts.length} brouillon{drafts.length > 1 ? 's' : ''} préparé{drafts.length > 1 ? 's' : ''} par Ibkek à valider.
        </p>
      )}

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
            const isDraft = item.status === 'DRAFT';
            const status = isDraft ? 'Brouillon' : !item.isActive ? 'Désactivée' : expired ? 'Expirée' : 'Active';
            const statusColor = isDraft ? 'bg-gold-100 text-gold-700'
              : !item.isActive ? 'bg-dark-100 text-dark-500'
              : expired ? 'bg-gold-100 text-gold-700'
              : 'bg-primary-100 text-primary-700';
            const ctr = item._count.views ? Math.round((item.clicks / item._count.views) * 100) : 0;
            return (
              <div key={item.id} className={`card p-4 sm:p-5 ${isDraft ? 'ring-1 ring-gold-300' : ''}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-dark-900">{item.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>{status}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${item.source === 'AI' ? 'bg-blue-50 text-blue-700' : 'bg-dark-100 text-dark-600'}`}>
                        {item.source === 'AI' ? <><Bot size={11} /> Rédigée par l’IA</> : <><User size={11} /> Admin{item.createdBy ? ` · ${item.createdBy.firstName}` : ''}</>}
                      </span>
                      {item.kind === 'UPDATE' && item.version && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-dark-50 text-dark-500 flex items-center gap-1"><GitCommit size={11} /> {short(item.version)}</span>
                      )}
                    </div>
                    <p className="text-sm text-dark-600 whitespace-pre-wrap">{item.message}</p>
                    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-2 text-xs text-dark-400">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString('fr-FR')}</span>
                      <span className="flex items-center gap-1"><Eye size={12} /> {item._count.views} vue{item._count.views > 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><MousePointerClick size={12} /> {item.clicks} clic{item.clicks > 1 ? 's' : ''}{item._count.views ? ` (${ctr} %)` : ''}</span>
                      {item.expiresAt && <span>{expired ? 'Expirée le' : 'Expire le'} {new Date(item.expiresAt).toLocaleDateString('fr-FR')}</span>}
                      {item.buttonLink && (
                        <span className="flex items-center gap-1 truncate max-w-[240px]"><Link2 size={12} /> {item.buttonText} → {item.buttonLink}</span>
                      )}
                    </div>
                    {!item.isActive && item.deactivatedReason && !isDraft && (
                      <p className="text-xs text-dark-400 mt-1.5 italic">{item.deactivatedReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {isDraft && (
                      <button onClick={() => run(`pub-${item.id}`, () => api.post(`/admin/system-announcements/${item.id}/publish`))} disabled={!!busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 disabled:opacity-50">
                        {busy === `pub-${item.id}` ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publier
                      </button>
                    )}
                    {item.source === 'AI' && (item.sourceCommits?.length ?? 0) > 0 && (
                      <button onClick={() => run(`regen-${item.id}`, () => api.post(`/admin/system-announcements/${item.id}/regenerate`))} disabled={!!busy}
                        title="Régénérer avec l'IA" className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                        {busy === `regen-${item.id}` ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      </button>
                    )}
                    <button onClick={() => openEdit(item)} title="Modifier" className="p-1.5 rounded-lg bg-dark-50 text-dark-500 hover:bg-dark-100">
                      <Pencil size={16} />
                    </button>
                    {!isDraft && (
                      <button onClick={() => run(`tog-${item.id}`, () => api.put(`/admin/system-announcements/${item.id}`, { isActive: !item.isActive }), item.isActive ? 'Annonce désactivée.' : 'Annonce réactivée.')}
                        disabled={!!busy} title={item.isActive ? 'Désactiver' : 'Réactiver'} className="p-1.5 rounded-lg bg-dark-50 text-dark-500 hover:bg-dark-100 disabled:opacity-50">
                        {busy === `tog-${item.id}` ? <Loader2 size={16} className="animate-spin" /> : item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                    <button onClick={() => remove(item.id)} disabled={!!busy} title="Supprimer"
                      className="p-1.5 rounded-lg bg-guinea-50 text-guinea-500 hover:bg-guinea-100 disabled:opacity-50">
                      {busy === `del-${item.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark-900">{editingId ? 'Modifier l’annonce' : 'Nouvelle annonce système'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-dark-50"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Titre</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Découvre Ibkek, notre nouvel assistant IA !" maxLength={100} className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Décris la nouveauté en quelques phrases..." maxLength={500} rows={4} className="input resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Texte du bouton <span className="text-dark-400 font-normal">(optionnel)</span></label>
                  <input value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} placeholder="Découvrir" maxLength={40} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Lien du bouton <span className="text-dark-400 font-normal">(optionnel)</span></label>
                  <input value={form.buttonLink} onChange={e => setForm({ ...form, buttonLink: e.target.value })} placeholder="/aide ou https://..." disabled={form.buttonLink === '#chat'} className="input disabled:opacity-50" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-dark-600 cursor-pointer">
                <input type="checkbox" checked={form.buttonLink === '#chat'} onChange={e => setForm({ ...form, buttonLink: e.target.checked ? '#chat' : '' })} className="rounded" />
                Ouvrir directement le chat Ibkek au clic (au lieu d'un lien)
              </label>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Date d'expiration <span className="text-dark-400 font-normal">(optionnel)</span></label>
                <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="input" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-dark-200 text-dark-600 font-medium hover:bg-dark-50 transition-colors">Annuler</button>
              <button onClick={submit} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin" />} {editingId ? 'Enregistrer' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
