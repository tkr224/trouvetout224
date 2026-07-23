'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import VoiceCallButton from '@/components/voice/VoiceCallButton';

type ChatMessage = { role: 'user' | 'model'; text: string };

const DISMISS_KEY = 'tt224-chat-dismissed';

export default function AiChatWidget() {
  const t = useTranslations('chatbot');
  const GREETING: ChatMessage = { role: 'model', text: t('greeting') };
  const FALLBACK_MESSAGE: ChatMessage = { role: 'model', text: t('fallbackMessage') };
  const QUOTA_MESSAGE: ChatMessage = { role: 'model', text: t('quotaMessage') };
  const [dismissed, setDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true);
    }
  }, []);

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

  const closeForSession = () => {
    setIsOpen(false);
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const history = nextMessages.slice(-10).map(m => ({ role: m.role, text: m.text }));
      const res = await api.post('/ai/chat', { message: text, history });
      setMessages(prev => [...prev, { role: 'model', text: res.data.reply }]);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      setMessages(prev => [...prev, code === 'AI_QUOTA_EXCEEDED' ? QUOTA_MESSAGE : FALLBACK_MESSAGE]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (dismissed && !isOpen) {
    return (
      <button
        onClick={() => { setDismissed(false); setIsOpen(true); }}
        aria-label={t('openAriaLabel')}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-primary-700 dark:bg-primary-600 text-white shadow-card-hover flex items-center justify-center hover:scale-105 transition-transform"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label={t('openAriaLabel')}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-primary-700 dark:bg-primary-600 text-white shadow-card-hover flex items-center justify-center hover:scale-105 transition-transform ring-4 ring-gold-400/30"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-96 sm:h-[32rem] z-50 flex flex-col bg-white dark:bg-dark-800 sm:rounded-2xl shadow-card-hover border border-dark-100 dark:border-dark-700 overflow-hidden">
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-primary-700 to-primary-800 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <MessageCircle size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{t('title')}</p>
                <p className="text-xs text-primary-100 leading-tight">{t('subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <VoiceCallButton variant="icon" className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20" />
              <button
                onClick={closeForSession}
                aria-label={t('hideAriaLabel')}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-dark-50/40 dark:bg-dark-900/40">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary-700 text-white rounded-br-sm'
                      : 'bg-dark-100 dark:bg-dark-700 text-dark-900 dark:text-dark-100 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-dark-100 dark:bg-dark-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Saisie */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              disabled={isSending}
              className="flex-1 bg-dark-50 dark:bg-dark-700 text-dark-900 dark:text-white placeholder-dark-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
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
    </>
  );
}
