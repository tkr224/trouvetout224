'use server';

import { cookies } from 'next/headers';
import type { AppLocale } from '@/i18n/request';

export async function setLocaleCookie(locale: AppLocale) {
  cookies().set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}
