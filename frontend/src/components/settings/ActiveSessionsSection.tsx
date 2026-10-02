'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Monitor, Loader2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { SettingsCard } from './SettingsUI';

interface Session {
  id: string;
  device: string;
  rememberMe: boolean;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

function getStoredRefreshToken(): string | undefined {
  try {
    const auth = JSON.parse(localStorage.getItem('tt224-auth') || '{}');
    return auth?.state?.refreshToken;
  } catch {
    return undefined;
  }
}

export default function ActiveSessionsSection() {
  const t = useTranslations('parametres.securite');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/auth/sessions', { headers: { 'X-Refresh-Token': getStoredRefreshToken() || '' } })
      .then(r => setSessions(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const revoke = async (id: string) => {
    setRevokingId(id);
    try {
      await api.delete(`/auth/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success(t('sessionRevoked'));
    } catch {
      toast.error(t('sessionRevokeError'));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <SettingsCard icon={Monitor} title={t('sessionsTitle')} description={t('sessionsHint')} bodyClassName="divide-y divide-dark-100">
      {loading ? (
        <div className="flex justify-center py-5"><Loader2 className="animate-spin text-dark-300" size={20} /></div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-dark-400 px-4 sm:px-5 py-4">{t('sessionsEmpty')}</p>
      ) : (
        sessions.map(s => (
          <div key={s.id} className="settings-row flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 min-h-[56px]">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-dark-900 truncate">{s.device}</p>
                {s.current && <span className="settings-badge shrink-0">{t('sessionCurrent')}</span>}
              </div>
              <p className="text-xs text-dark-500 mt-0.5">
                {t('sessionLastActive', { date: new Date(s.lastUsedAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) })}
              </p>
            </div>
            {!s.current && (
              <button
                onClick={() => revoke(s.id)}
                disabled={revokingId === s.id}
                title={t('sessionRevokeBtn')}
                aria-label={t('sessionRevokeBtn')}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-guinea-500 hover:bg-guinea-50 disabled:opacity-50"
              >
                {revokingId === s.id ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
              </button>
            )}
          </div>
        ))
      )}
    </SettingsCard>
  );
}
