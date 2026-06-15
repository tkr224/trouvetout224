// src/services/email.service.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export const sendVerificationEmail = async (email: string, firstName: string) => {
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
