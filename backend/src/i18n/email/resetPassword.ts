import type { EmailLocale } from '../emailLocales';

export const resetPasswordEmail: Record<
  EmailLocale,
  (vars: { firstName: string }) => { subject: string; greeting: string; intro: string; cta: string; expiry: string }
> = {
  FR: ({ firstName }) => ({
    subject: 'Réinitialisez votre mot de passe — TrouveTout224',
    greeting: `Bonjour ${firstName},`,
    intro: 'Vous avez demandé à réinitialiser votre mot de passe sur TrouveTout224.',
    cta: 'Choisir un nouveau mot de passe →',
    expiry: "Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.",
  }),
  EN: ({ firstName }) => ({
    subject: 'Reset your password — TrouveTout224',
    greeting: `Hi ${firstName},`,
    intro: 'You requested to reset your password on TrouveTout224.',
    cta: 'Choose a new password →',
    expiry: "This link expires in 1 hour. If you didn't request this, simply ignore this email.",
  }),
  ZH: ({ firstName }) => ({
    subject: '重置您的密码 — TrouveTout224',
    greeting: `您好，${firstName}，`,
    intro: '您请求重置在 TrouveTout224 上的密码。',
    cta: '设置新密码 →',
    expiry: '此链接将在 1 小时后失效。如果这不是您本人的操作，请忽略此邮件。',
  }),
};
