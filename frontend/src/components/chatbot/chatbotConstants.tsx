import { Bot, MessageCircle, Sparkles, HelpCircle, Headphones, Zap, ShoppingBag, Smile } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

// Icônes prédéfinies utilisables comme avatar du bot OU comme icône du bouton
// flottant qui ouvre le chat — même liste pour les deux usages (cohérence + code
// plus simple), voir points 3 et 19 de la personnalisation.
export const CHATBOT_ICONS: Record<string, LucideIcon> = {
  'message-circle': MessageCircle,
  bot: Bot,
  sparkles: Sparkles,
  'help-circle': HelpCircle,
  headphones: Headphones,
  zap: Zap,
  'shopping-bag': ShoppingBag,
  smile: Smile,
};

export const CHATBOT_ICON_KEYS = Object.keys(CHATBOT_ICONS);

export const CHATBOT_EMOJIS = ['🤖', '🙂', '🧑‍💻', '🦉', '🐆', '🌟', '💬', '🛍️', '🇬🇳', '✨'];

export const CHATBOT_BUBBLE_COLORS = [
  '#16a34a', // vert (défaut)
  '#1d4ed8', // bleu
  '#7e22ce', // violet
  '#d97706', // or
  '#dc2626', // rouge
  '#0f766e', // turquoise
  '#db2777', // rose
  '#111827', // noir/graphite
];

export const CHATBOT_BACKGROUNDS: { id: string; label: string }[] = [
  { id: 'NONE', label: 'Aucun' },
  { id: 'DOTS', label: 'Points' },
  { id: 'WAVES', label: 'Vagues' },
  { id: 'TINT_GREEN', label: 'Teinte verte' },
  { id: 'TINT_BLUE', label: 'Teinte bleue' },
];

// Style CSS appliqué à la zone de messages selon le fond choisi — motifs générés
// en pur CSS (aucune image externe à charger).
export function chatBackgroundStyle(id: string, isDark: boolean): CSSProperties {
  switch (id) {
    case 'DOTS':
      return {
        backgroundImage: `radial-gradient(${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'} 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
      };
    case 'WAVES':
      return {
        backgroundImage: `repeating-linear-gradient(135deg, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} 0px, transparent 2px, transparent 12px)`,
      };
    case 'TINT_GREEN':
      return { backgroundColor: isDark ? 'rgba(22,163,74,0.08)' : 'rgba(22,163,74,0.06)' };
    case 'TINT_BLUE':
      return { backgroundColor: isDark ? 'rgba(29,78,216,0.10)' : 'rgba(29,78,216,0.06)' };
    default:
      return {};
  }
}

export function chatFontFamilyClass(fontFamily: string): string {
  switch (fontFamily) {
    case 'SERIF': return 'font-serif';
    case 'MONO': return 'font-mono';
    case 'ROUNDED': return 'chat-font-rounded';
    default: return 'font-sans';
  }
}

export function chatFontSizeClass(fontSize: string): string {
  switch (fontSize) {
    case 'SMALL': return 'text-xs';
    case 'LARGE': return 'text-base';
    default: return 'text-sm';
  }
}
