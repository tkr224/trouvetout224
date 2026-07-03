// src/services/email.service.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Email envoyé aux abonnés quand un vendeur publie un nouveau produit approuvé
export const sendNewProductEmail = async (
  email: string,
  firstName: string,
  vendorName: string,
  productTitle: string,
  productUrl: string,
) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return; // SMTP non configuré
  await transporter.sendMail({
    from: `"TrouveTout224 🇬🇳" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: `Nouveau produit chez ${vendorName} — TrouveTout224`,
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
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
    `,
  });
};

export const sendResetPasswordEmail = async (email: string, firstName: string, resetUrl: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return; // SMTP non configuré
  await transporter.sendMail({
    from: `"TrouveTout224 🇬🇳" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Réinitialisez votre mot de passe — TrouveTout224',
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
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
    `,
  });
};

export const sendVerificationEmail = async (email: string, firstName: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  await transporter.sendMail({
    from: `"TrouveTout224 🇬🇳" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Bienvenue sur TrouveTout224 - Vérifiez votre email',
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
        <div style="background: #1B8B3B; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🇬🇳 TrouveTout224</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 8px; margin-top: 10px;">
          <h2>Bonjour ${firstName} ! 👋</h2>
          <p>Merci de rejoindre <strong>TrouveTout224</strong>, la plus grande plateforme d'annonces de Guinée !</p>
          <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
          <ul>
            <li>Publier des annonces gratuitement</li>
            <li>Contacter des vendeurs</li>
            <li>Trouver des emplois, logements, véhicules et plus encore</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}" style="background: #1B8B3B; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Accéder à TrouveTout224 →
            </a>
          </div>
        </div>
        <p style="color: #999; text-align: center; margin-top: 20px; font-size: 12px;">
          © 2024 TrouveTout224 | Conakry, Guinée
        </p>
      </div>
    `,
  });
};
