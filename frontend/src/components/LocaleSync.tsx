'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

function getCookieLocale(): string | undefined {
  return document.cookie.split('; ').find((c) => c.startsWith('NEXT_LOCALE='))?.split('=')[1];
}

// Resynchronise le cookie de langue avec la préférence enregistrée en base
// dès qu'un utilisateur se connecte (ex: sur un nouvel appareil).
export default function LocaleSync() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !user?.preferredLanguage) return;
    const dbLocale = user.preferredLanguage.toLowerCase();
    const cookieLocale = getCookieLocale() ?? 'fr';
    if (dbLocale !== cookieLocale) {
      document.cookie = `NEXT_LOCALE=${dbLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      router.refresh();
    }
  }, [hasHydrated, user?.preferredLanguage, router]);

  return null;
}
