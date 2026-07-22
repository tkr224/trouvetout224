import type { EmailLocale } from '../emailLocales';

export const emailChangeConfirmationEmail: Record<
  EmailLocale,
  (vars: { firstName: string }) => { subject: string; greeting: string; intro: string; cta: string; expiry: string }
> = {
  FR: ({ firstName }) => ({
    subject: 'Confirmez votre nouvelle adresse email — TrouveTout224',
    greeting: `Bonjour ${firstName},`,
    intro: 'Vous avez demandé à utiliser cette adresse comme nouvel email de connexion sur TrouveTout224.',
    cta: 'Confirmer cette adresse →',
    expiry: "Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre adresse actuelle restera inchangée.",
  }),
  EN: ({ firstName }) => ({
    subject: 'Confirm your new email address — TrouveTout224',
    greeting: `Hi ${firstName},`,
    intro: 'You requested to use this address as your new login email on TrouveTout224.',
    cta: 'Confirm this address →',
    expiry: "This link expires in 1 hour. If you didn't request this, simply ignore this email — your current address will stay unchanged.",
  }),
  ZH: ({ firstName }) => ({
    subject: '确认您的新邮箱地址 — TrouveTout224',
    greeting: `您好，${firstName}，`,
    intro: '您请求将此地址设为您在 TrouveTout224 上的新登录邮箱。',
    cta: '确认此地址 →',
    expiry: '此链接将在 1 小时后失效。如果这不是您本人的操作，请忽略此邮件 —— 您当前的邮箱地址将保持不变。',
  }),
};
