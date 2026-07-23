import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VOICE_DEFAULT_RATE } from '@/lib/webSpeech';

export const VOICE_RATE_MIN = 0.75;
export const VOICE_RATE_MAX = 1.25;
export const VOICE_RATE_STEP = 0.05;

interface VoicePrefsStore {
  // null = sélection automatique (meilleure voix détectée) — voir pickBestVoice()
  voiceURI: string | null;
  rate: number;
  setVoiceURI: (voiceURI: string | null) => void;
  setRate: (rate: number) => void;
}

export const useVoicePrefsStore = create<VoicePrefsStore>()(
  persist(
    (set) => ({
      voiceURI: null,
      rate: VOICE_DEFAULT_RATE,
      setVoiceURI: (voiceURI) => set({ voiceURI }),
      setRate: (rate) => set({ rate: Math.min(VOICE_RATE_MAX, Math.max(VOICE_RATE_MIN, rate)) }),
    }),
    { name: 'tt224-voice-prefs' }
  )
);
