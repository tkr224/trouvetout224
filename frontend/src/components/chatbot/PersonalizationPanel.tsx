'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, RotateCcw, Upload, Loader2, Pin, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import type { ChatbotPrefs, ChatbotQuickReply } from '@/hooks/useChatbotPrefs';
import ChatAvatar from './ChatAvatar';
import {
  CHATBOT_ICONS, CHATBOT_ICON_KEYS, CHATBOT_EMOJIS, CHATBOT_BUBBLE_COLORS, CHATBOT_BACKGROUNDS,
  chatFontFamilyClass, chatFontSizeClass,
} from './chatbotConstants';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-dark-100 dark:border-dark-700 last:border-b-0">
      <h3 className="text-xs font-bold uppercase tracking-wide text-dark-400 dark:text-dark-500 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer">
      <span>
        <span className="block text-sm text-dark-800 dark:text-dark-100">{label}</span>
        {hint && <span className="block text-xs text-dark-400 mt-0.5">{hint}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary-600' : 'bg-dark-200 dark:bg-dark-600'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

function ChipGroup<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            value === o.key
              ? 'bg-primary-700 border-primary-700 text-white'
              : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:border-primary-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ColorSwatches({ value, onChange, extra }: { value: string; onChange: (v: string) => void; extra?: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {CHATBOT_BUBBLE_COLORS.map(c => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onChange(c)}
          style={{ background: c }}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${value === c ? 'border-dark-900 dark:border-white scale-110' : 'border-transparent'}`}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-7 h-7 rounded-full overflow-hidden border border-dark-200 dark:border-dark-600 cursor-pointer bg-transparent"
        title={extra}
      />
    </div>
  );
}

export default function PersonalizationPanel({
  prefs, update, reset, onClose, isAuthenticated,
}: {
  prefs: ChatbotPrefs;
  update: (p: Partial<ChatbotPrefs>) => void;
  reset: () => Promise<void>;
  onClose: () => void;
  isAuthenticated: boolean;
}) {
  const t = useTranslations('chatbotCustomize');
  const [uploading, setUploading] = useState(false);
  const [newQrLabel, setNewQrLabel] = useState('');
  const [newQrMessage, setNewQrMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      update({ avatarType: 'CUSTOM', avatarValue: res.data.url });
    } catch {
      toast.error(t('avatarUploading'));
    } finally {
      setUploading(false);
    }
  };

  const addQuickReply = () => {
    if (!newQrLabel.trim() || !newQrMessage.trim()) return;
    if (prefs.quickReplies.length >= 8) { toast.error(t('quickRepliesLimitReached')); return; }
    const next: ChatbotQuickReply = {
      id: `qr_${Math.random().toString(36).slice(2, 10)}`,
      label: newQrLabel.trim().slice(0, 40),
      message: newQrMessage.trim().slice(0, 300),
      pinned: false,
    };
    update({ quickReplies: [...prefs.quickReplies, next] });
    setNewQrLabel('');
    setNewQrMessage('');
  };

  const removeQuickReply = (id: string) => {
    update({ quickReplies: prefs.quickReplies.filter(q => q.id !== id) });
  };

  const togglePinQuickReply = (id: string) => {
    update({ quickReplies: prefs.quickReplies.map(q => q.id === id ? { ...q, pinned: !q.pinned } : q) });
  };

  const doReset = async () => {
    if (!window.confirm(t('resetConfirm'))) return;
    await reset();
    toast.success(t('resetDone'));
  };

  const exportConversation = () => {
    try {
      const raw = sessionStorage.getItem('tt224-chat-transcript');
      if (!raw) { toast.error(t('exportEmpty')); return; }
      const messages: { role: string; text: string }[] = JSON.parse(raw);
      if (!messages.length) { toast.error(t('exportEmpty')); return; }
      const lines = messages.map(m => `${m.role === 'user' ? 'Moi' : prefs.botName} : ${m.text}`);
      const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${prefs.botName.toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t('exportDone'));
    } catch {
      toast.error(t('exportEmpty'));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:w-[30rem] sm:max-h-[85vh] max-h-[92vh] bg-white dark:bg-dark-800 sm:rounded-3xl rounded-t-3xl shadow-card-hover flex flex-col overflow-hidden"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100 dark:border-dark-700 shrink-0">
          <div>
            <h2 className="font-bold text-dark-900 dark:text-white">{t('title')}</h2>
            <p className="text-xs text-dark-400">{t('subtitle')}</p>
          </div>
          <button onClick={onClose} aria-label={t('close')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-dark-50 dark:hover:bg-dark-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {!isAuthenticated && (
            <p className="mt-4 text-xs text-gold-700 bg-gold-50 border border-gold-200 rounded-xl px-3 py-2">{t('anonymousNotice')}</p>
          )}

          {/* Aperçu en temps réel */}
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-dark-400 dark:text-dark-500 mb-2">{t('previewTitle')}</h3>
            <div className="rounded-2xl border border-dark-100 dark:border-dark-700 p-3 space-y-2 bg-dark-50/50 dark:bg-dark-900/40">
              <div className="flex items-end gap-2">
                <ChatAvatar type={prefs.avatarType} value={prefs.avatarValue} size={28} />
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl rounded-bl-sm text-white ${chatFontFamilyClass(prefs.fontFamily)} ${chatFontSizeClass(prefs.fontSize)}`} style={{ background: prefs.bubbleColor }}>
                  <p className="text-[11px] font-semibold mb-0.5 opacity-90" style={{ color: prefs.nameColor === prefs.bubbleColor ? 'rgba(255,255,255,0.85)' : undefined }}>{prefs.botName}</p>
                  {t('previewBotSample')}{prefs.signatureEmoji ? ` ${prefs.signatureEmoji}` : ''}
                </div>
              </div>
              <div className="flex justify-end">
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl rounded-br-sm bg-primary-700 text-white ${chatFontFamilyClass(prefs.fontFamily)} ${chatFontSizeClass(prefs.fontSize)}`}>
                  {t('previewUserSample')}
                </div>
              </div>
            </div>
          </div>

          <Section title={t('sectionIdentity')}>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('botNameLabel')}</label>
              <input
                value={prefs.botName}
                onChange={e => update({ botName: e.target.value.slice(0, 30) })}
                onBlur={() => { if (!prefs.botName.trim()) update({ botName: 'Ibkek' }); }}
                placeholder={t('botNamePlaceholder')}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('avatarLabel')}</label>
              <div className="flex gap-1.5 mb-2">
                <ChipGroup
                  options={[
                    { key: 'EMOJI', label: t('avatarEmojiTab') },
                    { key: 'ICON', label: t('avatarIconTab') },
                    { key: 'CUSTOM', label: t('avatarCustomTab') },
                  ]}
                  value={prefs.avatarType}
                  onChange={(v) => update({ avatarType: v as ChatbotPrefs['avatarType'] })}
                />
              </div>
              {prefs.avatarType === 'EMOJI' && (
                <div className="flex flex-wrap gap-1.5">
                  {CHATBOT_EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => update({ avatarValue: e })}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${prefs.avatarValue === e ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'border-dark-200 dark:border-dark-600'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
              {prefs.avatarType === 'ICON' && (
                <div className="flex flex-wrap gap-1.5">
                  {CHATBOT_ICON_KEYS.map(k => {
                    const Icon = CHATBOT_ICONS[k];
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => update({ avatarValue: k })}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${prefs.avatarValue === k ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'border-dark-200 dark:border-dark-600'}`}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
              )}
              {prefs.avatarType === 'CUSTOM' && (
                <div className="flex items-center gap-3">
                  <ChatAvatar type="CUSTOM" value={prefs.avatarValue} size={40} />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="text-sm font-semibold text-primary-700 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? t('avatarUploading') : t('avatarUploadBtn')}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('launcherIconLabel')}</label>
              <div className="flex flex-wrap gap-1.5">
                {CHATBOT_ICON_KEYS.map(k => {
                  const Icon = CHATBOT_ICONS[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => update({ launcherIcon: k })}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${prefs.launcherIcon === k ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'border-dark-200 dark:border-dark-600'}`}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title={t('sectionAppearance')}>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('bubbleColorLabel')}</label>
              <ColorSwatches value={prefs.bubbleColor} onChange={v => update({ bubbleColor: v })} />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('nameColorLabel')}</label>
              <ColorSwatches value={prefs.nameColor} onChange={v => update({ nameColor: v })} />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('badgeColorLabel')}</label>
              <ColorSwatches value={prefs.badgeColor} onChange={v => update({ badgeColor: v })} />
            </div>
          </Section>

          <Section title={t('sectionWindow')}>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('windowThemeLabel')}</label>
              <ChipGroup
                options={[
                  { key: 'SYSTEM', label: t('windowThemeSystem') },
                  { key: 'LIGHT', label: t('windowThemeLight') },
                  { key: 'DARK', label: t('windowThemeDark') },
                ]}
                value={prefs.windowTheme}
                onChange={v => update({ windowTheme: v as ChatbotPrefs['windowTheme'] })}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('windowSizeLabel')}</label>
              <ChipGroup
                options={[
                  { key: 'COMPACT', label: t('windowSizeCompact') },
                  { key: 'LARGE', label: t('windowSizeLarge') },
                ]}
                value={prefs.windowSize}
                onChange={v => update({ windowSize: v as ChatbotPrefs['windowSize'] })}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('fontSizeLabel')}</label>
              <ChipGroup
                options={[
                  { key: 'SMALL', label: t('fontSizeSmall') },
                  { key: 'MEDIUM', label: t('fontSizeMedium') },
                  { key: 'LARGE', label: t('fontSizeLarge') },
                ]}
                value={prefs.fontSize}
                onChange={v => update({ fontSize: v as ChatbotPrefs['fontSize'] })}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('fontFamilyLabel')}</label>
              <ChipGroup
                options={[
                  { key: 'SYSTEM', label: t('fontFamilySystem') },
                  { key: 'SERIF', label: t('fontFamilySerif') },
                  { key: 'MONO', label: t('fontFamilyMono') },
                  { key: 'ROUNDED', label: t('fontFamilyRounded') },
                ]}
                value={prefs.fontFamily}
                onChange={v => update({ fontFamily: v as ChatbotPrefs['fontFamily'] })}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('backgroundLabel')}</label>
              <ChipGroup
                options={CHATBOT_BACKGROUNDS.map(b => ({ key: b.id, label: b.label }))}
                value={prefs.chatBackground}
                onChange={v => update({ chatBackground: v })}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('positionLabel')}</label>
              <ChipGroup
                options={[
                  { key: 'BOTTOM_RIGHT', label: t('positionRight') },
                  { key: 'BOTTOM_LEFT', label: t('positionLeft') },
                ]}
                value={prefs.bubblePosition}
                onChange={v => update({ bubblePosition: v as ChatbotPrefs['bubblePosition'] })}
              />
            </div>
          </Section>

          <Section title={t('sectionBehavior')}>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('toneLabel')}</label>
              <ChipGroup
                options={[
                  { key: 'CASUAL', label: t('toneCasual') },
                  { key: 'FORMAL', label: t('toneFormal') },
                ]}
                value={prefs.tone}
                onChange={v => update({ tone: v as ChatbotPrefs['tone'] })}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('personalityLabel')}</label>
              <ChipGroup
                options={[
                  { key: 'PRO', label: t('personalityPro') },
                  { key: 'FUNNY', label: t('personalityFunny') },
                  { key: 'DIRECT', label: t('personalityDirect') },
                ]}
                value={prefs.personality}
                onChange={v => update({ personality: v as ChatbotPrefs['personality'] })}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('languageLabel')}</label>
              <ChipGroup
                options={[
                  { key: 'FR', label: t('languageFr') },
                  { key: 'EN', label: t('languageEn') },
                ]}
                value={prefs.botLanguage}
                onChange={v => update({ botLanguage: v as ChatbotPrefs['botLanguage'] })}
              />
            </div>
            <Toggle checked={prefs.useFirstName} onChange={v => update({ useFirstName: v })} label={t('useFirstNameLabel')} hint={t('useFirstNameHint')} />
          </Section>

          <Section title={t('sectionContent')}>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('welcomeMessageLabel')}</label>
              <textarea
                value={prefs.welcomeMessage || ''}
                onChange={e => update({ welcomeMessage: e.target.value.slice(0, 300) || null })}
                placeholder={t('welcomeMessagePlaceholder')}
                rows={2}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('signatureEmojiLabel')}</label>
              <input
                value={prefs.signatureEmoji || ''}
                onChange={e => update({ signatureEmoji: e.target.value.slice(0, 8) || null })}
                placeholder={t('signatureEmojiPlaceholder')}
                className="input"
              />
              <p className="text-xs text-dark-400 mt-1">{t('signatureEmojiHint')}</p>
            </div>
            <div>
              <label className="block text-sm text-dark-700 dark:text-dark-200 mb-1.5">{t('messageSignatureLabel')}</label>
              <input
                value={prefs.messageSignature || ''}
                onChange={e => update({ messageSignature: e.target.value.slice(0, 60) || null })}
                placeholder={t('messageSignaturePlaceholder')}
                className="input"
              />
            </div>
          </Section>

          <Section title={t('sectionQuickReplies')}>
            <p className="text-xs text-dark-400">{t('quickRepliesHint')}</p>
            <div className="space-y-2">
              {prefs.quickReplies.map(qr => (
                <div key={qr.id} className="flex items-center gap-2 bg-dark-50 dark:bg-dark-700/50 rounded-xl px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-800 dark:text-dark-100 truncate">{qr.label}</p>
                    <p className="text-xs text-dark-400 truncate">{qr.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePinQuickReply(qr.id)}
                    aria-label={qr.pinned ? t('quickReplyUnpin') : t('quickReplyPin')}
                    className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg ${qr.pinned ? 'text-gold-600 bg-gold-50' : 'text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-600'}`}
                  >
                    <Pin size={14} fill={qr.pinned ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuickReply(qr.id)}
                    aria-label={t('quickReplyRemove')}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-guinea-600 hover:bg-guinea-50 dark:hover:bg-guinea-900/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {prefs.quickReplies.length < 8 && (
              <div className="space-y-1.5 pt-1">
                <input
                  value={newQrLabel}
                  onChange={e => setNewQrLabel(e.target.value)}
                  placeholder={t('quickReplyLabelPlaceholder')}
                  className="input"
                />
                <input
                  value={newQrMessage}
                  onChange={e => setNewQrMessage(e.target.value)}
                  placeholder={t('quickReplyMessagePlaceholder')}
                  className="input"
                />
                <button
                  type="button"
                  onClick={addQuickReply}
                  disabled={!newQrLabel.trim() || !newQrMessage.trim()}
                  className="text-sm font-semibold text-primary-700 flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Plus size={14} /> {t('quickReplyAdd')}
                </button>
              </div>
            )}
          </Section>

          <Section title={t('sectionSound')}>
            <Toggle checked={prefs.soundEnabled} onChange={v => update({ soundEnabled: v })} label={t('soundEnabledLabel')} />
            <Toggle checked={prefs.sendSoundEnabled} onChange={v => update({ sendSoundEnabled: v })} label={t('sendSoundEnabledLabel')} />
            <Toggle checked={prefs.vibrationEnabled} onChange={v => update({ vibrationEnabled: v })} label={t('vibrationEnabledLabel')} />
            <Toggle checked={prefs.silentMode} onChange={v => update({ silentMode: v })} label={t('silentModeLabel')} hint={t('silentModeHint')} />
            <Toggle checked={prefs.historyVisibleByDefault} onChange={v => update({ historyVisibleByDefault: v })} label={t('historyVisibleLabel')} hint={t('historyVisibleHint')} />
            <button
              type="button"
              onClick={exportConversation}
              className="w-full text-sm font-semibold text-primary-700 border border-primary-200 dark:border-primary-800 rounded-xl py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            >
              {t('exportBtn')}
            </button>
          </Section>
        </div>

        <div className="px-5 py-3.5 border-t border-dark-100 dark:border-dark-700 shrink-0">
          <button
            type="button"
            onClick={doReset}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-dark-500 dark:text-dark-300 py-2 hover:text-guinea-600"
          >
            <RotateCcw size={14} /> {t('resetBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
