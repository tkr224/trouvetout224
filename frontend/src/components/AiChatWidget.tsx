'use client';

import { useEffect, useRef, useState } from 'react';
import { Settings, Send, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import VoiceCallButton from '@/components/voice/VoiceCallButton';
import ChatAvatar from '@/components/chatbot/ChatAvatar';
import PersonalizationPanel from '@/components/chatbot/PersonalizationPanel';
import { useChatbotPrefs } from '@/hooks/useChatbotPrefs';
import { useResolvedDarkMode } from '@/hooks/useResolvedDarkMode';
import { CHATBOT_ICONS, chatBackgroundStyle, chatFontFamilyClass, chatFontSizeClass } from '@/components/chatbot/chatbotConstants';
import { playSendSound, playNotificationSound, vibrateShort } from '@/components/chatbot/chatbotFeedback';
import ThemeAnimations from '@/components/ThemeAnimations';

type ChatMessage = { role: 'user' | 'model'; text: string };

const DISMISS_KEY = 'tt224-chat-dismissed';
const TRANSCRIPT_KEY = 'tt224-chat-transcript';

export default function AiChatWidget() {
  const t = useTranslations('chatbot');
  const { prefs, update, reset, isAuthenticated } = useChatbotPrefs();
  const siteIsDark = useResolvedDarkMode();

  const effectiveDark = prefs.windowTheme === 'DARK' ? true : prefs.windowTheme === 'LIGHT' ? false : siteIsDark;

  const greetingText = prefs.welcomeMessage?.trim() || t('greeting', { name: prefs.botName });
  const buildGreeting = (): ChatMessage => ({ role: 'model', text: greetingText });
  const FALLBACK_MESSAGE: ChatMessage = { role: 'model', text: t('fallbackMessage') };
  const QUOTA_MESSAGE: ChatMessage = { role: 'model', text: t('quotaMessage') };

  const [dismissed, setDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([buildGreeting()]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true);
    }
  }, []);

  // Charge l'historique persisté (sessionStorage) si le réglage "historique visible à
  // l'ouverture" est activé — sinon on repart d'un chat vierge à chaque fois, même si
  // l'historique reste sauvegardé en coulisses pour l'export.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = sessionStorage.getItem(TRANSCRIPT_KEY);
      if (prefs.historyVisibleByDefault && raw) {
        const stored: ChatMessage[] = JSON.parse(raw);
        if (Array.isArray(stored) && stored.length) { setMessages(stored); return; }
      }
    } catch {}
    setMessages([buildGreeting()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.historyVisibleByDefault, prefs.welcomeMessage, prefs.botName]);

  useEffect(() => {
    try { sessionStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  // Permet à l'écran d'appel vocal (bascule "Continuer par écrit") de rouvrir
  // ce widget sans avoir à partager d'état global entre les deux composants.
  useEffect(() => {
    const openChat = () => { setDismissed(false); setIsOpen(true); };
    window.addEventListener('tt224:open-chat', openChat);
    return () => window.removeEventListener('tt224:open-chat', openChat);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  const closeForSession = () => {
    setIsOpen(false);
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  const pushBotMessage = (text: string) => {
    let finalText = text;
    if (prefs.signatureEmoji) finalText = `${finalText} ${prefs.signatureEmoji}`;
    if (prefs.messageSignature) finalText = `${finalText}\n\n${prefs.messageSignature}`;
    setMessages(prev => [...prev, { role: 'model', text: finalText }]);
    if (!prefs.silentMode) {
      if (prefs.soundEnabled) playNotificationSound();
      if (prefs.vibrationEnabled) vibrateShort();
    }
    if (!isOpen) setUnreadCount(c => c + 1);
  };

  const sendText = async (text: string) => {
    if (!text.trim() || isSending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);
    if (!prefs.silentMode && prefs.sendSoundEnabled) playSendSound();

    try {
      const history = nextMessages.slice(-10).map(m => ({ role: m.role, text: m.text }));
      const res = await api.post('/ai/chat', { message: text, history });
      pushBotMessage(res.data.reply);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      setMessages(prev => [...prev, code === 'AI_QUOTA_EXCEEDED' ? QUOTA_MESSAGE : FALLBACK_MESSAGE]);
    } finally {
      setIsSending(false);
    }
  };

  const send = () => sendText(input.trim());

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const pinnedReplies = prefs.quickReplies.filter(q => q.pinned);
  const LauncherIcon = CHATBOT_ICONS[prefs.launcherIcon] || CHATBOT_ICONS['message-circle'];
  const isLeft = prefs.bubblePosition === 'BOTTOM_LEFT';

  const launcherPos = isLeft
    ? 'fixed bottom-20 left-4 sm:bottom-6 sm:left-6'
    : 'fixed bottom-20 right-4 sm:bottom-6 sm:right-6';
  const windowPos = isLeft
    ? 'fixed inset-0 sm:inset-auto sm:bottom-24 sm:left-6'
    : 'fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6';
  const windowSizeClass = prefs.windowSize === 'LARGE' ? 'sm:w-[28rem] sm:h-[42rem]' : 'sm:w-96 sm:h-[32rem]';

  // Couleurs explicites (pas de `dark:`) : voir useResolvedDarkMode — un ancêtre
  // `.dark` global (thème du site) ne doit pas pouvoir forcer le mode sombre du chat
  // si l'utilisateur a choisi "Clair" pour la fenêtre, et inversement.
  const windowBg = effectiveDark ? 'bg-dark-800' : 'bg-white';
  const windowBorder = effectiveDark ? 'border-dark-700' : 'border-dark-100';
  const messagesAreaBg = effectiveDark ? 'bg-dark-900/40' : 'bg-dark-50/40';
  const inputAreaBg = effectiveDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-dark-100';
  const inputFieldBg = effectiveDark ? 'bg-dark-700 text-white placeholder-dark-400' : 'bg-dark-50 text-dark-900 placeholder-dark-400';
  const botBubbleTextColor = effectiveDark ? '#ffffff' : '#111827';
  const botBubbleBg = effectiveDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.06)';

  const fontClasses = `${chatFontFamilyClass(prefs.fontFamily)} ${chatFontSizeClass(prefs.fontSize)}`;

  if (dismissed && !isOpen) {
    return (
      <div className={`${launcherPos} z-40`}>
        <button
          onClick={() => { setDismissed(false); setIsOpen(true); }}
          aria-label={t('openAriaLabel')}
          className="relative w-14 h-14 rounded-full bg-primary-700 dark:bg-primary-600 text-white shadow-card-hover flex items-center justify-center hover:scale-105 transition-transform"
        >
          <LauncherIcon size={24} />
          {unreadCount > 0 && (
            <span
              style={{ background: prefs.badgeColor }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-white text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-dark-900"
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      {!isOpen && (
        <div className={`${launcherPos} z-40`}>
          <button
            onClick={() => setIsOpen(true)}
            aria-label={t('openAriaLabel')}
            className="relative w-14 h-14 rounded-full bg-primary-700 dark:bg-primary-600 text-white shadow-card-hover flex items-center justify-center hover:scale-105 transition-transform ring-4 ring-gold-400/30"
          >
            <LauncherIcon size={24} />
            {unreadCount > 0 && (
              <span
                style={{ background: prefs.badgeColor }}
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-white text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-dark-900"
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {isOpen && (
        <div className={`${windowPos} ${windowSizeClass} z-50 flex flex-col ${windowBg} sm:rounded-2xl shadow-card-hover border ${windowBorder} overflow-hidden ${fontClasses}`}>
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-primary-700 to-primary-800 text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <ChatAvatar type={prefs.avatarType} value={prefs.avatarValue} size={36} />
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{prefs.botName}</p>
                <p className="text-xs text-primary-100 leading-tight">{t('subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <VoiceCallButton variant="icon" className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20" />
              <button
                onClick={() => setShowSettings(true)}
                aria-label={t('settingsAriaLabel')}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={closeForSession}
                aria-label={t('hideAriaLabel')}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages — quand "suivre le thème du site" est actif, les effets visuels
              du thème actif (particules, motifs animés...) sont rejoués ICI, cadrés au
              chat (voir .chat-effects-scope dans globals.css), en plus de la palette de
              couleurs déjà héritée automatiquement via les variables CSS --p-*. */}
          <div className="flex-1 relative overflow-hidden chat-effects-scope">
            {prefs.windowTheme === 'SYSTEM' && <ThemeAnimations />}
            <div className={`relative z-[1] h-full overflow-y-auto px-4 py-4 space-y-3 ${messagesAreaBg}`} style={chatBackgroundStyle(prefs.chatBackground, effectiveDark)}>
            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'model' && <ChatAvatar type={prefs.avatarType} value={prefs.avatarValue} size={24} />}
                {m.role === 'user' ? (
                  <div className="max-w-[78%] px-4 py-2.5 leading-relaxed whitespace-pre-wrap bg-primary-700 text-white rounded-2xl rounded-br-sm">
                    {m.text}
                  </div>
                ) : (
                  <div
                    className="max-w-[78%] px-4 py-2.5 leading-relaxed whitespace-pre-wrap rounded-2xl rounded-bl-sm"
                    style={{ background: botBubbleBg, color: botBubbleTextColor }}
                  >
                    <p className="text-[11px] font-semibold mb-0.5" style={{ color: prefs.nameColor }}>{prefs.botName}</p>
                    {m.text}
                  </div>
                )}
              </div>
            ))}
            {isSending && (
              <div className="flex items-end gap-2 justify-start">
                <ChatAvatar type={prefs.avatarType} value={prefs.avatarValue} size={24} />
                <div style={{ background: botBubbleBg, borderRadius: '18px 18px 18px 4px' }} className="px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full chat-typing-dot" style={{ background: prefs.bubbleColor, animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full chat-typing-dot" style={{ background: prefs.bubbleColor, animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full chat-typing-dot" style={{ background: prefs.bubbleColor, animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs opacity-70" style={{ color: botBubbleTextColor }}>{t('typing', { name: prefs.botName })}</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
            </div>
          </div>

          {/* Raccourcis rapides épinglés */}
          {pinnedReplies.length > 0 && (
            <div className={`flex gap-1.5 overflow-x-auto px-3 py-2 border-t shrink-0 ${inputAreaBg}`}>
              {pinnedReplies.map(qr => (
                <button
                  key={qr.id}
                  onClick={() => sendText(qr.message)}
                  disabled={isSending}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Saisie */}
          <div className={`flex items-center gap-2 px-3 py-3 border-t shrink-0 ${inputAreaBg}`}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              disabled={isSending}
              className={`flex-1 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${inputFieldBg}`}
            />
            <button
              onClick={send}
              disabled={isSending || !input.trim()}
              aria-label={t('sendAriaLabel')}
              className="w-10 h-10 shrink-0 rounded-xl bg-primary-700 text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <PersonalizationPanel
          prefs={prefs}
          update={update}
          reset={reset}
          onClose={() => setShowSettings(false)}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  );
}
