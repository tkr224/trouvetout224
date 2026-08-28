import { Bot } from 'lucide-react';
import { CHATBOT_ICONS } from './chatbotConstants';
import type { ChatbotPrefs } from '@/hooks/useChatbotPrefs';

export default function ChatAvatar({
  type, value, size = 36, ringColor,
}: {
  type: ChatbotPrefs['avatarType'];
  value: string;
  size?: number;
  ringColor?: string;
}) {
  const style = { width: size, height: size, boxShadow: ringColor ? `0 0 0 2px ${ringColor}33` : undefined };

  if (type === 'CUSTOM' && value) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={value}
        alt=""
        style={style}
        className="rounded-full object-cover shrink-0 bg-dark-100 dark:bg-dark-700"
      />
    );
  }

  if (type === 'ICON') {
    const Icon = CHATBOT_ICONS[value] || Bot;
    return (
      <div
        style={style}
        className="rounded-full flex items-center justify-center shrink-0 bg-white/15"
      >
        <Icon size={Math.round(size * 0.55)} />
      </div>
    );
  }

  return (
    <div
      style={style}
      className="rounded-full flex items-center justify-center shrink-0 bg-white/15 text-lg leading-none"
    >
      <span style={{ fontSize: Math.round(size * 0.55) }}>{value || '🤖'}</span>
    </div>
  );
}
