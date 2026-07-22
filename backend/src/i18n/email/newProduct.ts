import type { EmailLocale } from '../emailLocales';

export const newProductEmail: Record<
  EmailLocale,
  (vars: { firstName: string; vendorName: string; productTitle: string; productUrl: string }) => {
    subject: string;
    greeting: string;
    intro: string;
    cta: string;
    footer: string;
    manageLink: string;
  }
> = {
  FR: ({ firstName, vendorName }) => ({
    subject: `Nouveau produit chez ${vendorName} — TrouveTout224`,
    greeting: `Bonjour ${firstName} ! 🔔`,
    intro: `La boutique <strong>${vendorName}</strong> que vous suivez vient de publier un nouveau produit :`,
    cta: 'Voir le produit →',
    footer: `Vous recevez cet email car vous êtes abonné à ${vendorName} sur TrouveTout224.`,
    manageLink: 'Mes abonnements',
  }),
  EN: ({ firstName, vendorName }) => ({
    subject: `New product from ${vendorName} — TrouveTout224`,
    greeting: `Hi ${firstName}! 🔔`,
    intro: `The shop <strong>${vendorName}</strong> you follow just posted a new product:`,
    cta: 'View product →',
    footer: `You're receiving this email because you follow ${vendorName} on TrouveTout224.`,
    manageLink: 'My subscriptions',
  }),
  ZH: ({ firstName, vendorName }) => ({
    subject: `${vendorName} 发布了新商品 — TrouveTout224`,
    greeting: `您好，${firstName}！🔔`,
    intro: `您关注的商店 <strong>${vendorName}</strong> 刚刚发布了一件新商品：`,
    cta: '查看商品 →',
    footer: `您收到此邮件是因为您在 TrouveTout224 上关注了 ${vendorName}。`,
    manageLink: '我的订阅',
  }),
};
