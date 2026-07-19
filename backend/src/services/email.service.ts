// src/services/email.service.ts
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Adresse de test fournie par Resend, à utiliser tant que le domaine trouvetout224.site
// n'est pas vérifié sur Resend. Une fois vérifié, remplacer par :
// 'TrouveTout224 🇬🇳 <contact@trouvetout224.site>'
const FROM_ADDRESS = 'TrouveTout224 🇬🇳 <onboarding@resend.dev>';

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

// Sans le <meta charset="UTF-8"> et le wrapper <html>/<body>, certains clients mail
// (Gmail notamment) devinent mal l'encodage et affichent les accents/emoji déformés,
// et le centrage en div margin:auto n'est pas fiable partout — d'où la table centrée.
const wrapEmailHtml = (bodyContent: string) => `<!DOCTYPE html>
<html lang="fr">
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

const sendEmail = async ({ to, subject, html }: SendEmailArgs) => {
  if (!resend) {
    console.log('Email non envoyé : RESEND_API_KEY manquante');
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
      console.log('Erreur envoi email (Resend):', error);
      return;
    }
    console.log('Email envoyé avec succès (Resend), id:', data?.id);
  } catch (e: any) {
    console.log('Erreur envoi email (Resend):', e?.message || e);
  }
};

// Email envoyé aux abonnés quand un vendeur publie un nouveau produit approuvé
export const sendNewProductEmail = async (
  email: string,
  firstName: string,
  vendorName: string,
  productTitle: string,
  productUrl: string,
) => {
  await sendEmail({
    to: email,
    subject: `Nouveau produit chez ${vendorName} — TrouveTout224`,
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #1B8B3B; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2 style="color: #1B8B3B;">Bonjour ${firstName} ! 🔔</h2>
          <p>La boutique <strong>${vendorName}</strong> que vous suivez vient de publier un nouveau produit :</p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-size: 18px; font-weight: bold; color: #111827; margin: 0;">${productTitle}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${productUrl}" style="background: #1B8B3B; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Voir le produit →
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
            Vous recevez cet email car vous êtes abonné à ${vendorName} sur TrouveTout224.
            <br>Pour gérer vos abonnements : <a href="${process.env.FRONTEND_URL}/abonnements" style="color: #1B8B3B;">Mes abonnements</a>
          </p>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `),
  });
};

export const sendResetPasswordEmail = async (email: string, firstName: string, resetUrl: string) => {
  await sendEmail({
    to: email,
    subject: 'Réinitialisez votre mot de passe — TrouveTout224',
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #1B8B3B; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2 style="color: #1B8B3B;">Bonjour ${firstName},</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe sur TrouveTout224.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #1B8B3B; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Choisir un nouveau mot de passe →
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `),
  });
};

// Alerte de sécurité envoyée quand une info sensible du compte est modifiée
// (email, mot de passe, téléphone, questions de sécurité). actionLabel ex :
// "mot de passe", "adresse email", "numéro de téléphone", "questions de sécurité".
export const sendSecurityAlertEmail = async (email: string, firstName: string, actionLabel: string) => {
  const when = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  await sendEmail({
    to: email,
    subject: `Alerte sécurité : ${actionLabel} modifié — TrouveTout224`,
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #CE1126; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2 style="color: #CE1126;">Bonjour ${firstName},</h2>
          <p>Votre <strong>${actionLabel}</strong> vient d'être modifié sur votre compte TrouveTout224, le ${when}.</p>
          <p>Si c'est bien vous, vous n'avez rien à faire.</p>
          <p><strong>Si ce n'est pas vous</strong>, contactez-nous immédiatement :</p>
          <ul style="color: #374151;">
            <li>WhatsApp : <a href="https://wa.me/224627543486" style="color: #CE1126;">+224 627 54 34 86</a></li>
            <li>Email : contact.trouvetout224@gmail.com</li>
          </ul>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `),
  });
};

// Lien de confirmation envoyé à la NOUVELLE adresse email lors d'un changement d'email.
export const sendEmailChangeConfirmation = async (email: string, firstName: string, confirmUrl: string) => {
  await sendEmail({
    to: email,
    subject: 'Confirmez votre nouvelle adresse email — TrouveTout224',
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #1B8B3B; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2 style="color: #1B8B3B;">Bonjour ${firstName},</h2>
          <p>Vous avez demandé à utiliser cette adresse comme nouvel email de connexion sur TrouveTout224.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background: #1B8B3B; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Confirmer cette adresse →
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre adresse actuelle restera inchangée.</p>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `),
  });
};

export const sendVerificationEmail = async (email: string, firstName: string, verifyUrl: string) => {
  await sendEmail({
    to: email,
    subject: 'Bienvenue sur TrouveTout224 - Confirmez votre email',
    html: wrapEmailHtml(`
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
        <div style="background: #1B8B3B; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2>Bonjour ${firstName} ! 👋</h2>
          <p>Merci de rejoindre <strong>TrouveTout224</strong>, la plus grande plateforme d'annonces de Guinée !</p>
          <p>Pour sécuriser votre compte, confirmez votre adresse email en cliquant sur le bouton ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #1B8B3B; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Vérifier mon email →
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.</p>
          <p style="margin-top: 24px;">Une fois votre email confirmé, vous pourrez profiter pleinement de TrouveTout224 :</p>
          <ul>
            <li>Publier des annonces gratuitement</li>
            <li>Contacter des vendeurs</li>
            <li>Trouver des emplois, logements, véhicules et plus encore</li>
          </ul>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `),
  });
};
