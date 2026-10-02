'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Volume2, PlayCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { listVoicesFor, speechLangFor, isVoiceCallSupported, VOICE_DEFAULT_PITCH, VOICE_DEFAULT_VOLUME } from '@/lib/webSpeech';
import { useVoicePrefsStore, VOICE_RATE_MIN, VOICE_RATE_MAX, VOICE_RATE_STEP } from '@/store/voicePrefs.store';
import { SettingsCard } from './SettingsUI';

const SAMPLE_TEXT: Record<string, string> = {
  fr: "Bonjour, je suis Ibkek, l'assistant vocal de TrouveTout224. Comment puis-je t'aider aujourd'hui ?",
  en: "Hello, I'm Ibkek, the TrouveTout224 voice assistant. How can I help you today?",
  zh: '你好，我是 Ibkek，TrouveTout224 的语音助手。今天能帮你什么？',
};

// Section "Voix de l'assistant" des Paramètres — liste les voix françaises (ou
// EN/ZH selon la langue de l'interface) réellement disponibles sur l'appareil
// de l'utilisateur, avec un bouton d'écoute par voix et un réglage de vitesse.
export default function VoiceSettingsSection() {
  const t = useTranslations('parametres');
  const locale = useLocale();
  const { voiceURI, rate, setVoiceURI, setRate } = useVoicePrefsStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[] | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isVoiceCallSupported()) { setVoices([]); return; }
    listVoicesFor(speechLangFor(locale)).then((list) => { if (!cancelled) setVoices(list); });
    return () => { cancelled = true; };
  }, [locale]);

  const playSample = (voice?: SpeechSynthesisVoice) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(SAMPLE_TEXT[locale] || SAMPLE_TEXT.fr);
    utterance.lang = speechLangFor(locale);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = VOICE_DEFAULT_PITCH;
    utterance.volume = VOICE_DEFAULT_VOLUME;
    const key = voice?.voiceURI || 'auto';
    setPlayingKey(key);
    utterance.onend = () => setPlayingKey((k) => (k === key ? null : k));
    utterance.onerror = () => setPlayingKey((k) => (k === key ? null : k));
    window.speechSynthesis.speak(utterance);
  };

  const card = (children: React.ReactNode, withSubtitle = true) => (
    <SettingsCard icon={Volume2} title={t('apparence.voix.title')} description={withSubtitle ? t('apparence.voix.subtitle') : undefined}>
      {children}
    </SettingsCard>
  );

  if (voices === null) return card(<p className="text-dark-400 text-xs">{t('apparence.voix.loading')}</p>, false);

  if (voices.length === 0) {
    return card(
      <div className="flex items-start gap-3 p-3.5 bg-gold-50 border border-gold-200 rounded-xl">
        <AlertTriangle size={16} className="text-gold-600 shrink-0 mt-0.5" />
        <p className="text-dark-700 text-sm">{t('apparence.voix.noneAvailable')}</p>
      </div>,
      false,
    );
  }

  const options: { uri: string | null; label: string; voice?: SpeechSynthesisVoice }[] = [
    { uri: null, label: t('apparence.voix.auto') },
    ...voices.map((v) => ({ uri: v.voiceURI, label: v.name, voice: v })),
  ];

  return card(
    <>
      <div className="space-y-1.5">
        {options.map((opt) => {
          const active = voiceURI === opt.uri;
          const key = opt.uri || 'auto';
          const isPlaying = playingKey === key;
          return (
            <div key={key} className={`settings-tile flex items-center gap-2 justify-between rounded-xl border ${active ? 'is-active' : ''}`}>
              <button
                onClick={() => setVoiceURI(opt.uri)}
                aria-pressed={active}
                className="flex-1 min-w-0 flex items-center gap-2.5 text-left min-h-[44px] px-3 py-2"
              >
                {active
                  ? <CheckCircle size={16} className="shrink-0" />
                  : <span className="w-4 h-4 shrink-0 rounded-full border-2 border-dark-300" />}
                <span className="text-sm font-medium truncate">{opt.label}</span>
              </button>
              <button
                onClick={() => playSample(opt.voice)}
                aria-label={t('apparence.voix.listen')}
                title={t('apparence.voix.listen')}
                className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-primary-700 hover:bg-primary-50 transition-colors mr-1"
              >
                <PlayCircle size={18} strokeWidth={1.75} className={isPlaying ? 'animate-pulse' : ''} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-dark-900">{t('apparence.voix.rate')}</label>
          <span className="text-primary-700 text-sm font-semibold tabular-nums">{rate.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={VOICE_RATE_MIN}
          max={VOICE_RATE_MAX}
          step={VOICE_RATE_STEP}
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-full accent-primary-700"
        />
        <div className="flex justify-between text-dark-400 text-xs mt-1">
          <span>{t('apparence.voix.slower')}</span>
          <span>{t('apparence.voix.faster')}</span>
        </div>
      </div>
    </>
  );
}
