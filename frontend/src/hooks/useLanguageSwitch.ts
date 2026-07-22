'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { setLocaleCookie } from '@/lib/locale-actions';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import type { AppLocale } from '@/i18n/request';

export function useLanguageSwitch() {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const [isPending, startTransition] = useTransition();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const switchLocale = (next: AppLocale) => {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleCookie(next);
      if (isAuthenticated) {
        api.put('/users/me', { preferredLanguage: next.toUpperCase() }).catch(() => {});
      }
      router.refresh();
    });
  };

  return { locale, switchLocale, isPending };
}
