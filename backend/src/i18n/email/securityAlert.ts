import type { EmailLocale } from '../emailLocales';

export type SecurityActionKey = 'password' | 'email' | 'phone' | 'securityQuestions';

const ACTION_LABELS: Record<EmailLocale, Record<SecurityActionKey, string>> = {
  FR: {
    password: 'mot de passe',
    email: 'adresse email',
    phone: 'numéro de téléphone',
    securityQuestions: 'questions de sécurité',
  },
  EN: {
    password: 'password',
    email: 'email address',
    phone: 'phone number',
    securityQuestions: 'security questions',
  },
  ZH: {
    password: '密码',
    email: '邮箱地址',
    phone: '手机号码',
    securityQuestions: '安全问题',
  },
};

export const securityAlertEmail: Record<
  EmailLocale,
  (vars: { firstName: string; actionKey: SecurityActionKey; when: string }) => {
    subject: string;
    greeting: string;
    body: string;
    okNote: string;
    notYouNote: string;
    contactWhatsapp: string;
    contactEmail: string;
  }
> = {
  FR: ({ firstName, actionKey, when }) => {
    const actionLabel = ACTION_LABELS.FR[actionKey];
    return {
      subject: `Alerte sécurité : ${actionLabel} modifié — TrouveTout224`,
      greeting: `Bonjour ${firstName},`,
      body: `Votre <strong>${actionLabel}</strong> vient d'être modifié sur votre compte TrouveTout224, le ${when}.`,
      okNote: "Si c'est bien vous, vous n'avez rien à faire.",
      notYouNote: "<strong>Si ce n'est pas vous</strong>, contactez-nous immédiatement :",
      contactWhatsapp: 'WhatsApp',
      contactEmail: 'Email',
    };
  },
  EN: ({ firstName, actionKey, when }) => {
    const actionLabel = ACTION_LABELS.EN[actionKey];
    return {
      subject: `Security alert: ${actionLabel} changed — TrouveTout224`,
      greeting: `Hi ${firstName},`,
      body: `Your <strong>${actionLabel}</strong> was just changed on your TrouveTout224 account, on ${when}.`,
      okNote: "If this was you, there's nothing else to do.",
      notYouNote: '<strong>If this wasn\'t you</strong>, contact us immediately:',
      contactWhatsapp: 'WhatsApp',
      contactEmail: 'Email',
    };
  },
  ZH: ({ firstName, actionKey, when }) => {
    const actionLabel = ACTION_LABELS.ZH[actionKey];
    return {
      subject: `安全提醒：您的${actionLabel}已被修改 — TrouveTout224`,
      greeting: `您好，${firstName}，`,
      body: `您 TrouveTout224 账户的<strong>${actionLabel}</strong>已于 ${when} 被修改。`,
      okNote: '如果这是您本人的操作，则无需进行任何处理。',
      notYouNote: '<strong>如果这不是您本人的操作</strong>，请立即联系我们：',
      contactWhatsapp: 'WhatsApp',
      contactEmail: '邮箱',
    };
  },
};
