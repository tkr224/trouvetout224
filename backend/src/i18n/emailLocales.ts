// Langues disponibles pour les emails transactionnels (miroir de l'enum Prisma `Locale`).
export type EmailLocale = 'FR' | 'EN' | 'ZH';
export const DEFAULT_EMAIL_LOCALE: EmailLocale = 'FR';

// Convertit la préférence de langue de l'utilisateur (ou une valeur absente/invalide) en
// langue d'email valide — repli sur le français si la valeur n'est pas reconnue.
export function resolveEmailLocale(locale?: string | null): EmailLocale {
  return locale === 'EN' || locale === 'ZH' ? locale : DEFAULT_EMAIL_LOCALE;
}

export const EMAIL_LANG_ATTR: Record<EmailLocale, string> = {
  FR: 'fr',
  EN: 'en',
  ZH: 'zh',
};

// Tag Intl utilisé pour formater les dates (ex: dans l'email d'alerte sécurité).
export const EMAIL_INTL_LOCALE: Record<EmailLocale, string> = {
  FR: 'fr-FR',
  EN: 'en-US',
  ZH: 'zh-CN',
};
