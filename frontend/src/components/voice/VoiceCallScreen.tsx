'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Phone, PhoneOff, Mic, MicOff, X, VolumeX, AlertTriangle,
  MessageCircle, Sparkles, Loader2, ShieldCheck,
} from 'lucide-react';
import { useVoiceCallStore } from '@/store/voiceCall.store';
import { useVoiceCall } from '@/hooks/useVoiceCall';

function formatSeconds(total: number): string {
  const s = Math.max(0, Math.round(total));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatResetIn(resetAt: string, hoursLabel: string, minutesLabel: string): string {
  const diffMs = new Date(resetAt).getTime() - Date.now();
  const totalMinutes = Math.max(1, Math.round(diffMs / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}${hoursLabel} ${m}${minutesLabel}`;
  return `${m}${minutesLabel}`;
}

export default function VoiceCallScreen() {
  const t = useTranslations('voiceCall');
  const isOpen = useVoiceCallStore(s => s.isOpen);
  const close = useVoiceCallStore(s => s.close);
  const {
    state, turns, interimTranscript, quota, remainingSeconds,
    showLowTimeWarning, dismissLowTimeWarning, errorMessage,
    requestStart, confirmAndListen, interrupt, hangup, reset,
  } = useVoiceCall();

  // Ouverture de la fenêtre → on lance immédiatement la vérification de quota.
  useEffect(() => {
    if (isOpen) requestStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const isCallActive = state === 'listening' || state === 'thinking' || state === 'speaking';

  const closeModal = () => {
    if (isCallActive) hangup();
    reset();
    close();
  };

  const continueAsText = () => {
    reset();
    close();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tt224:open-chat'));
  };

  const lastModelTurn = [...turns].reverse().find(x => x.role === 'model');

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-br from-primary-900 via-primary-800 to-dark-900 text-white">
      {/* Bouton fermer — toujours accessible, sauf en plein appel actif où on préfère "Raccrocher" */}
      {!isCallActive && (
        <button
          onClick={closeModal}
          aria-label={t('close')}
          className="absolute top-4 right-4 z-10 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center max-w-md mx-auto w-full">

        {/* ── Vérification du quota ────────────────────────────────── */}
        {state === 'checking' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={36} className="animate-spin text-gold-300" />
            <p className="text-white/80">{t('checking')}</p>
          </div>
        )}

        {/* ── Explication avant la demande de micro ───────────────────── */}
        {state === 'permission-explain' && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Mic size={28} className="text-gold-300" />
            </div>
            <h2 className="font-display font-bold text-xl">{t('permissionExplainTitle')}</h2>
            <p className="text-white/80 text-sm leading-relaxed">{t('permissionExplainMessage')}</p>
            <div className="flex gap-3 mt-2 w-full">
              <button onClick={closeModal} className="flex-1 min-h-[44px] rounded-xl border border-white/25 hover:bg-white/10 font-medium transition-colors">
                {t('cancelBtn')}
              </button>
              <button onClick={confirmAndListen} className="flex-1 min-h-[44px] rounded-xl bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold transition-colors">
                {t('continueBtn')}
              </button>
            </div>
          </div>
        )}

        {/* ── Demande de micro en cours ────────────────────────────────── */}
        {state === 'requesting-mic' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={36} className="animate-spin text-gold-300" />
            <p className="text-white/80">{t('requestingMic')}</p>
          </div>
        )}

        {/* ── Micro refusé ─────────────────────────────────────────────── */}
        {state === 'mic-denied' && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-guinea-500/20 border border-guinea-400/40 flex items-center justify-center">
              <MicOff size={28} className="text-guinea-300" />
            </div>
            <h2 className="font-display font-bold text-xl">{t('micDeniedTitle')}</h2>
            <p className="text-white/80 text-sm leading-relaxed">{t('micDeniedMessage')}</p>
            <button onClick={continueAsText} className="min-h-[44px] px-5 rounded-xl bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold transition-colors inline-flex items-center gap-2">
              <MessageCircle size={16} /> {t('continueAsText')}
            </button>
          </div>
        )}

        {/* ── Navigateur non compatible ────────────────────────────────── */}
        {state === 'unsupported' && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <AlertTriangle size={28} className="text-gold-300" />
            </div>
            <h2 className="font-display font-bold text-xl">{t('unsupportedTitle')}</h2>
            <p className="text-white/80 text-sm leading-relaxed">{t('unsupportedMessage')}</p>
            <button onClick={continueAsText} className="min-h-[44px] px-5 rounded-xl bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold transition-colors inline-flex items-center gap-2">
              <MessageCircle size={16} /> {t('continueAsText')}
            </button>
          </div>
        )}

        {/* ── Appel en cours (écoute / réflexion / parole) ────────────────── */}
        {isCallActive && (
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Avatar animé selon l'état */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {state === 'listening' && (
                <>
                  <span className="absolute inset-0 rounded-full bg-primary-400/30 animate-ping" />
                  <span className="absolute inset-2 rounded-full bg-primary-400/20 animate-pulse" />
                </>
              )}
              {state === 'speaking' && (
                <span className="absolute inset-0 rounded-full bg-gold-400/30 animate-pulse" />
              )}
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-colors ${
                  state === 'listening' ? 'bg-primary-600' : state === 'thinking' ? 'bg-dark-700' : 'bg-gold-500'
                }`}
              >
                {state === 'listening' && <Mic size={32} className="text-white" />}
                {state === 'thinking' && <Loader2 size={32} className="text-white animate-spin" />}
                {state === 'speaking' && (
                  <div className="flex items-end gap-1 h-8">
                    {[0, 1, 2, 3].map(i => (
                      <span
                        key={i}
                        className="w-1.5 bg-white rounded-full animate-bounce"
                        style={{ height: `${12 + (i % 2) * 10}px`, animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="font-semibold text-white/90">
              {state === 'listening' && t('listening')}
              {state === 'thinking' && t('thinking')}
              {state === 'speaking' && t('speaking')}
            </p>

            {/* Sous-titres : transcript en direct ou dernière réponse */}
            <div className="min-h-[3.5rem] px-2">
              {state === 'listening' && interimTranscript && (
                <p className="text-white/70 text-sm italic">« {interimTranscript} »</p>
              )}
              {(state === 'speaking' || state === 'thinking') && lastModelTurn && (
                <p className="text-white text-sm leading-relaxed">{lastModelTurn.text}</p>
              )}
            </div>

            {/* Temps restant */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-white/50 text-xs uppercase tracking-widest">{t('remainingLabel')}</p>
              <p className="font-display font-bold text-2xl tabular-nums">{formatSeconds(remainingSeconds)}</p>
            </div>

            {showLowTimeWarning && (
              <button
                onClick={dismissLowTimeWarning}
                className="bg-gold-500/20 border border-gold-400/40 text-gold-200 text-xs px-3 py-2 rounded-xl max-w-xs"
              >
                {t('lowTimeWarning')}
              </button>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-4">
              {state === 'speaking' && (
                <button
                  onClick={interrupt}
                  aria-label={t('interrupt')}
                  title={t('interrupt')}
                  className="w-14 h-14 min-w-[44px] min-h-[44px] rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <VolumeX size={22} />
                </button>
              )}
              <button
                onClick={closeModal}
                aria-label={t('hangup')}
                title={t('hangup')}
                className="w-16 h-16 min-w-[44px] min-h-[44px] rounded-full bg-guinea-600 hover:bg-guinea-700 flex items-center justify-center transition-colors shadow-lg"
              >
                <PhoneOff size={26} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ── Quota épuisé ─────────────────────────────────────────────── */}
        {state === 'quota-exceeded' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Phone size={28} className="text-gold-300" />
            </div>
            <h2 className="font-display font-bold text-xl">{t('quotaExceededTitle')}</h2>
            <p className="text-white/80 text-sm leading-relaxed">{t('quotaExceededMessage')}</p>
            {quota && (
              <p className="text-gold-300 font-semibold text-sm">
                {t('resetIn', { time: formatResetIn(quota.resetAt, t('hoursShort'), t('minutesShort')) })}
              </p>
            )}

            <div className="w-full space-y-2.5 mt-2">
              <button onClick={continueAsText} className="w-full min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 font-semibold transition-colors inline-flex items-center justify-center gap-2">
                <MessageCircle size={16} /> {t('continueAsText')}
              </button>
              <a
                href="https://wa.me/224627543486"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors inline-flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> {t('talkOnWhatsapp')}
              </a>
            </div>

            {quota?.tier !== 'MANSA' && (
              <a
                href="/premium"
                onClick={closeModal}
                className="w-full mt-3 p-4 rounded-xl border border-gold-400/40 bg-gold-500/10 text-left flex items-center gap-3 hover:bg-gold-500/15 transition-colors"
              >
                <Sparkles size={20} className="text-gold-300 shrink-0" />
                <span>
                  <span className="block font-semibold text-gold-200 text-sm">{t('mansaUpsellTitle')}</span>
                  <span className="block text-white/60 text-xs">{t('mansaUpsellDesc')}</span>
                </span>
              </a>
            )}

            <button onClick={closeModal} className="mt-4 text-white/50 text-sm hover:text-white/80 transition-colors">
              {t('close')}
            </button>
          </div>
        )}

        {/* ── Erreur technique ─────────────────────────────────────────── */}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-16 h-16 rounded-2xl bg-guinea-500/20 border border-guinea-400/40 flex items-center justify-center">
              <AlertTriangle size={28} className="text-guinea-300" />
            </div>
            <h2 className="font-display font-bold text-xl">{t('errorTitle')}</h2>
            <p className="text-white/80 text-sm leading-relaxed">{errorMessage || t('errorGenericMessage')}</p>
            <div className="w-full space-y-2.5 mt-2">
              <button onClick={continueAsText} className="w-full min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 font-semibold transition-colors inline-flex items-center justify-center gap-2">
                <MessageCircle size={16} /> {t('continueAsText')}
              </button>
              <a
                href="https://wa.me/224627543486"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors inline-flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> {t('talkOnWhatsapp')}
              </a>
            </div>
            <button onClick={closeModal} className="mt-4 text-white/50 text-sm hover:text-white/80 transition-colors">
              {t('close')}
            </button>
          </div>
        )}
      </div>

      {/* Confidentialité — petite mention discrète en bas */}
      {(state === 'permission-explain' || isCallActive) && (
        <p className="text-white/30 text-[11px] flex items-center justify-center gap-1.5 pb-4">
          <ShieldCheck size={12} /> TrouveTout224
        </p>
      )}
    </div>
  );
}
