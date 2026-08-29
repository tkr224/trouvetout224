'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Hash } from 'lucide-react';
import { api } from '@/lib/api';

const MAX_HASHTAGS = 10;

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  title: string;
  description: string;
  categoryId?: string;
}

// Saisie de hashtags en chips + suggestions auto-générées côté serveur à partir
// du titre/description/catégorie (ex: annonce "iPhone 13" dans Téléphones ->
// suggère #iPhone #Telephones224). Cliquer une suggestion l'ajoute directement.
export default function HashtagInput({ value, onChange, title, description, categoryId }: Props) {
  const t = useTranslations('publier.annonce');
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!title.trim() && !description.trim()) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      api.get('/annonces/hashtag-suggestions', { params: { title, description, categoryId } })
        .then(r => setSuggestions(r.data.data || []))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [title, description, categoryId]);

  const addTag = (raw: string) => {
    const clean = raw.trim().replace(/^#+/, '');
    if (!clean || value.length >= MAX_HASHTAGS) return;
    if (value.some(v => v.toLowerCase() === clean.toLowerCase())) return;
    onChange([...value, clean]);
    setInput('');
  };

  const removeTag = (tag: string) => onChange(value.filter(v => v !== tag));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const availableSuggestions = suggestions.filter(
    s => !value.some(v => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border border-dark-200 rounded-xl px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Hash size={11} />{tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-primary-400 hover:text-primary-700">
              <X size={12} />
            </button>
          </span>
        ))}
        {value.length < MAX_HASHTAGS && (
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addTag(input)}
            placeholder={value.length === 0 ? t('hashtagsPlaceholder') : ''}
            className="flex-1 min-w-[100px] text-sm outline-none py-0.5"
          />
        )}
      </div>
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {availableSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="inline-flex items-center gap-1 text-xs font-medium text-dark-500 border border-dark-200 hover:border-primary-400 hover:text-primary-700 px-2.5 py-1 rounded-full transition-colors"
            >
              <Hash size={11} />{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
