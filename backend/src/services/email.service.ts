// src/services/email.service.ts
import { Resend } from 'resend';
import { EmailLocale, DEFAULT_EMAIL_LOCALE, EMAIL_LANG_ATTR, EMAIL_INTL_LOCALE } from '../i18n/emailLocales';
import { newProductEmail } from '../i18n/email/newProduct';
import { resetPasswordEmail } from '../i18n/email/resetPassword';
import { securityAlertEmail, SecurityActionKey } from '../i18n/email/securityAlert';
import { emailChangeConfirmationEmail } from '../i18n/email/emailChangeConfirmation';
import { verificationEmail } from '../i18n/email/verification';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Adresse de test fournie par Resend, à utiliser tant que le domaine trouvetout224.site
// n'est pas vérifié sur Resend. Une fois vérifié, remplacer par :
// 'TrouveTout224 🇬🇳 <contact@trouvetout224.site>'
const FROM_ADDRESS = 'TrouveTout224 🇬🇳 <onboarding@resend.dev>';

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  // Étiquette courte affichée dans les logs (Railway) pour distinguer les
  // différents types d'email envoyés — ex : 'CHANGEMENT_EMAIL', 'RESET_PASSWORD'.
  context: string;
};

// Sans le <meta charset="UTF-8"> et le wrapper <html>/<body>, certains clients mail
// (Gmail notamment) devinent mal l'encodage et affichent les accents/emoji déformés,
// et le centrage en div margin:auto n'est pas fiable partout — d'où la table centrée.
const wrapEmailHtml = (bodyContent: string, locale: EmailLocale = DEFAULT_EMAIL_LOCALE) => `<!DOCTYPE html>
<html lang="${EMAIL_LANG_ATTR[locale]}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; font-family: Arial, Helvetica, sans-serif;">
          <tr><td>${bodyContent}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const sendEmail = async ({ to, subject, html, context }: SendEmailArgs) => {
  if (!resend) {
    console.log(`[Resend][${context}] Email NON envoyé à ${to} : RESEND_API_KEY manquante`);
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      // error vient directement de l'API Resend (ex: sandbox non vérifié,
      // destinataire refusé...) — on le logge en entier pour voir la raison exacte.
      console.log(`[Resend][${context}] ERREUR envoi à ${to} :`, JSON.stringify(error));
      return;
    }
    console.log(`[Resend][${context}] Email envoyé avec succès à ${to} (id: ${data?.id})`);
  } catch (e: any) {
    console.log(`[Resend][${context}] EXCEPTION envoi à ${to} :`, e?.message || e);
  }
};

// Email envoyé aux abonnés quand un vendeur publie un nouveau produit approuvé
export const sendNewProductEmail = async (
  email: string,
  firstName: string,
  vendorName: string,
  productTitle: string,
  productUrl: string,
  locale: EmailLocale = DEFAULT_EMAIL_LOCALE,
) => {
  const tr = newProductEmail[locale]({ firstName, vendorName, productTitle, productUrl });
  await sendEmail({
    to: email,
    context: 'NOUVEAU_PRODUIT',
    subject: tr.subject,
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #1B8B3B; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2 style="color: #1B8B3B;">${tr.greeting}</h2>
          <p>${tr.intro}</p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-size: 18px; font-weight: bold; color: #111827; margin: 0;">${productTitle}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${productUrl}" style="background: #1B8B3B; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              ${tr.cta}
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
            ${tr.footer}
            <br><a href="${process.env.FRONTEND_URL}/abonnements" style="color: #1B8B3B;">${tr.manageLink}</a>
          </p>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `, locale),
  });
};

export const sendResetPasswordEmail = async (
  email: string,
  firstName: string,
  resetUrl: string,
  locale: EmailLocale = DEFAULT_EMAIL_LOCALE,
) => {
  const tr = resetPasswordEmail[locale]({ firstName });
  await sendEmail({
    to: email,
    context: 'RESET_PASSWORD',
    subject: tr.subject,
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #1B8B3B; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2 style="color: #1B8B3B;">${tr.greeting}</h2>
          <p>${tr.intro}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #1B8B3B; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              ${tr.cta}
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">${tr.expiry}</p>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `, locale),
  });
};

// Alerte de sécurité envoyée quand une info sensible du compte est modifiée
// (email, mot de passe, téléphone, questions de sécurité). actionKey identifie
// laquelle — le libellé traduit est résolu dans securityAlertEmail selon la langue.
export const sendSecurityAlertEmail = async (
  email: string,
  firstName: string,
  actionKey: SecurityActionKey,
  locale: EmailLocale = DEFAULT_EMAIL_LOCALE,
) => {
  const when = new Date().toLocaleString(EMAIL_INTL_LOCALE[locale], { dateStyle: 'long', timeStyle: 'short' });
  const tr = securityAlertEmail[locale]({ firstName, actionKey, when });
  await sendEmail({
    to: email,
    context: 'ALERTE_SECURITE',
    subject: tr.subject,
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #CE1126; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2 style="color: #CE1126;">${tr.greeting}</h2>
          <p>${tr.body}</p>
          <p>${tr.okNote}</p>
          <p>${tr.notYouNote}</p>
          <ul style="color: #374151;">
            <li>${tr.contactWhatsapp} : <a href="https://wa.me/224627543486" style="color: #CE1126;">+224 627 54 34 86</a></li>
            <li>${tr.contactEmail} : contact.trouvetout224@gmail.com</li>
          </ul>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `, locale),
  });
};

// Lien de confirmation envoyé à la NOUVELLE adresse email lors d'un changement d'email.
export const sendEmailChangeConfirmation = async (
  email: string,
  firstName: string,
  confirmUrl: string,
  locale: EmailLocale = DEFAULT_EMAIL_LOCALE,
) => {
  const tr = emailChangeConfirmationEmail[locale]({ firstName });
  await sendEmail({
    to: email,
    context: 'CHANGEMENT_EMAIL',
    subject: tr.subject,
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #1B8B3B; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2 style="color: #1B8B3B;">${tr.greeting}</h2>
          <p>${tr.intro}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background: #1B8B3B; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              ${tr.cta}
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">${tr.expiry}</p>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `, locale),
  });
};

export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  verifyUrl: string,
  locale: EmailLocale = DEFAULT_EMAIL_LOCALE,
) => {
  const tr = verificationEmail[locale]({ firstName });
  await sendEmail({
    to: email,
    context: 'VERIFICATION_EMAIL',
    subject: tr.subject,
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #1B8B3B; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2>${tr.greeting}</h2>
          <p>${tr.intro}</p>
          <p>${tr.ctaIntro}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #1B8B3B; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              ${tr.cta}
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">${tr.expiry}</p>
          <p style="margin-top: 24px;">${tr.afterIntro}</p>
          <ul>
            <li>${tr.perk1}</li>
            <li>${tr.perk2}</li>
            <li>${tr.perk3}</li>
          </ul>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `, locale),
  });
};
