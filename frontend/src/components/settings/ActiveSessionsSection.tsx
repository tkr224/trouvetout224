'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Monitor, Loader2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

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
    <div>
      <h3 className="font-semibold text-dark-900 flex items-center gap-2 mb-1">
        <Monitor size={16} className="text-primary-700" /> {t('sessionsTitle')}
      </h3>
      <p className="text-xs text-dark-500 mb-3">{t('sessionsHint')}</p>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-dark-300" size={20} /></div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-dark-400">{t('sessionsEmpty')}</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-3 bg-dark-50 rounded-xl px-3.5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-dark-800 truncate">{s.device}</p>
                  {s.current && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 shrink-0">
                      {t('sessionCurrent')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-500">
                  {t('sessionLastActive', { date: new Date(s.lastUsedAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) })}
                </p>
              </div>
              {!s.current && (
                <button
                  onClick={() => revoke(s.id)}
                  disabled={revokingId === s.id}
                  title={t('sessionRevokeBtn')}
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-guinea-500 hover:bg-guinea-50 disabled:opacity-50"
                >
                  {revokingId === s.id ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
