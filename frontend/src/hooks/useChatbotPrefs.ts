'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export interface ChatbotQuickReply {
  id: string;
  label: string;
  message: string;
  pinned: boolean;
}

export interface ChatbotPrefs {
  botName: string;
  bubbleColor: string;
  nameColor: string;
  avatarType: 'EMOJI' | 'ICON' | 'CUSTOM';
  avatarValue: string;
  tone: 'FORMAL' | 'CASUAL';
  personality: 'PRO' | 'FUNNY' | 'DIRECT';
  botLanguage: 'FR' | 'EN';
  useFirstName: boolean;
  windowTheme: 'LIGHT' | 'DARK' | 'SYSTEM';
  windowSize: 'COMPACT' | 'LARGE';
  fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  fontFamily: 'SYSTEM' | 'SERIF' | 'MONO' | 'ROUNDED';
  chatBackground: string;
  bubblePosition: 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';
  launcherIcon: string;
  soundEnabled: boolean;
  sendSoundEnabled: boolean;
  vibrationEnabled: boolean;
  silentMode: boolean;
  badgeColor: string;
  welcomeMessage: string | null;
  signatureEmoji: string | null;
  messageSignature: string | null;
  quickReplies: ChatbotQuickReply[];
  historyVisibleByDefault: boolean;
}

// Doit rester en phase avec les valeurs @default() de ChatbotPreference dans
// schema.prisma — c'est ce que voit un utilisateur qui n'a encore rien personnalisé,
// et ce que garde un visiteur non connecté (préférences non persistées pour lui).
export const DEFAULT_CHATBOT_PREFS: ChatbotPrefs = {
  botName: 'Ibkek',
  bubbleColor: '#16a34a',
  nameColor: '#16a34a',
  avatarType: 'EMOJI',
  avatarValue: '🤖',
  tone: 'CASUAL',
  personality: 'PRO',
  botLanguage: 'FR',
  useFirstName: true,
  windowTheme: 'SYSTEM',
  windowSize: 'COMPACT',
  fontSize: 'MEDIUM',
  fontFamily: 'SYSTEM',
  chatBackground: 'NONE',
  bubblePosition: 'BOTTOM_RIGHT',
  launcherIcon: 'message-circle',
  soundEnabled: true,
  sendSoundEnabled: true,
  vibrationEnabled: true,
  silentMode: false,
  badgeColor: '#dc2626',
  welcomeMessage: null,
  signatureEmoji: null,
  messageSignature: null,
  quickReplies: [],
  historyVisibleByDefault: true,
};

const SAVE_DEBOUNCE_MS = 700;

// Préférences du chatbot par utilisateur, sauvegardées en base (table
// chatbot_preferences). Mise à jour "optimiste" : l'état local (donc l'aperçu et le
// rendu du widget) change instantanément, la sauvegarde réseau est débouncée pour ne
// pas spammer l'API pendant qu'on glisse un curseur ou tape du texte.
export function useChatbotPrefs() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [prefs, setPrefs] = useState<ChatbotPrefs>(DEFAULT_CHATBOT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const pendingRef = useRef<Partial<ChatbotPrefs>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { setLoaded(true); return; }
    api.get('/chatbot-prefs/me')
      .then(r => setPrefs({ ...DEFAULT_CHATBOT_PREFS, ...r.data.data }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [_hasHydrated, isAuthenticated]);

  const flush = useCallback(() => {
    if (!isAuthenticated || Object.keys(pendingRef.current).length === 0) return;
    const payload = pendingRef.current;
    pendingRef.current = {};
    api.put('/chatbot-prefs/me', payload).catch(() => {});
  }, [isAuthenticated]);

  const update = useCallback((partial: Partial<ChatbotPrefs>) => {
    setPrefs(p => ({ ...p, ...partial }));
    if (!isAuthenticated) return; // visiteur non connecté : reste local pour cette session
    pendingRef.current = { ...pendingRef.current, ...partial };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }, [isAuthenticated, flush]);

  const reset = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = {};
    setPrefs(DEFAULT_CHATBOT_PREFS);
    if (isAuthenticated) {
      try { await api.delete('/chatbot-prefs/me'); } catch {}
    }
  }, [isAuthenticated]);

  // Sauvegarde ce qui reste en attente si l'utilisateur ferme l'onglet / navigue
  // avant la fin du délai de debounce.
  useEffect(() => {
    window.addEventListener('beforeunload', flush);
    return () => { window.removeEventListener('beforeunload', flush); flush(); };
  }, [flush]);

  return { prefs, update, reset, loaded, isAuthenticated };
}
