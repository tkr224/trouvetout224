import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['fr', 'en', 'zh'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'fr';

// Un fichier JSON par namespace et par langue — facile à retrouver et à
// modifier (voir frontend/messages/<langue>/<namespace>.json).
const NAMESPACES = [
  'common', 'nav', 'footer', 'auth', 'publier', 'toasts', 'accueil',
  'annonces', 'boutiques', 'categories', 'profil', 'parametres', 'faq',
  'apropos', 'aide', 'confidentialite', 'chatbot', 'onboarding', 'security',
  'emplois', 'restaurants', 'hotels', 'listings', 'premium', 'messages',
  'notifications', 'vendeur', 'legal', 'notFound',
] as const;

async function loadMessages(locale: AppLocale) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../../messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    })
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get('NEXT_LOCALE')?.value;
  const locale: AppLocale = (locales as readonly string[]).includes(cookieLocale ?? '')
    ? (cookieLocale as AppLocale)
    : defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
