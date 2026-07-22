'use client';

import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import { LANGUAGES } from '@/lib/languages';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'inline';
}

export default function LanguageSwitcher({ variant = 'icon' }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { locale, switchLocale, isPending } = useLanguageSwitch();
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  const handleSelect = (code: typeof locale) => {
    setOpen(false);
    switchLocale(code);
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            disabled={isPending}
            onClick={() => switchLocale(lang.code)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-60 ${
              locale === lang.code
                ? 'border-primary-700 bg-primary-50 text-primary-700'
                : 'border-dark-200 text-dark-600 hover:border-primary-400 hover:bg-dark-50'
            }`}
          >
            <span className="text-base leading-none">{lang.flag}</span>
            {lang.label}
            {locale === lang.code && <Check size={14} />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={isPending}
        className="nav-icon-btn w-9 h-9 flex items-center justify-center rounded-xl border border-dark-200 text-dark-500 transition-colors disabled:opacity-60"
        title="Langue / Language / 语言"
        aria-label="Changer de langue"
      >
        <span className="text-base leading-none">{current.flag}</span>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white rounded-xl border border-dark-100 shadow-card-hover py-1 min-w-[160px] z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2.5 text-left px-4 py-2 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors ${
                lang.code === locale ? 'text-primary-700 font-semibold bg-primary-50' : 'text-dark-600'
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              {lang.label}
              {lang.code === locale && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
