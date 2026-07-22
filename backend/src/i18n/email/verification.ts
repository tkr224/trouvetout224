import type { EmailLocale } from '../emailLocales';

export const verificationEmail: Record<
  EmailLocale,
  (vars: { firstName: string }) => {
    subject: string;
    greeting: string;
    intro: string;
    ctaIntro: string;
    cta: string;
    expiry: string;
    afterIntro: string;
    perk1: string;
    perk2: string;
    perk3: string;
  }
> = {
  FR: ({ firstName }) => ({
    subject: 'Bienvenue sur TrouveTout224 - Confirmez votre email',
    greeting: `Bonjour ${firstName} ! 👋`,
    intro: "Merci de rejoindre <strong>TrouveTout224</strong>, la plus grande plateforme d'annonces de Guinée !",
    ctaIntro: 'Pour sécuriser votre compte, confirmez votre adresse email en cliquant sur le bouton ci-dessous :',
    cta: 'Vérifier mon email →',
    expiry: "Ce lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.",
    afterIntro: 'Une fois votre email confirmé, vous pourrez profiter pleinement de TrouveTout224 :',
    perk1: 'Publier des annonces gratuitement',
    perk2: 'Contacter des vendeurs',
    perk3: 'Trouver des emplois, logements, véhicules et plus encore',
  }),
  EN: ({ firstName }) => ({
    subject: 'Welcome to TrouveTout224 - Confirm your email',
    greeting: `Hi ${firstName}! 👋`,
    intro: "Thanks for joining <strong>TrouveTout224</strong>, Guinea's largest classifieds platform!",
    ctaIntro: 'To secure your account, confirm your email address by clicking the button below:',
    cta: 'Verify my email →',
    expiry: "This link expires in 24 hours. If you didn't create this account, simply ignore this email.",
    afterIntro: 'Once your email is confirmed, you can make the most of TrouveTout224:',
    perk1: 'Post ads for free',
    perk2: 'Contact sellers',
    perk3: 'Find jobs, homes, vehicles and more',
  }),
  ZH: ({ firstName }) => ({
    subject: '欢迎来到 TrouveTout224 - 请确认您的邮箱',
    greeting: `您好，${firstName}！👋`,
    intro: '感谢您加入 <strong>TrouveTout224</strong>，几内亚最大的分类广告平台！',
    ctaIntro: '为保障您的账户安全，请点击下方按钮确认您的邮箱地址：',
    cta: '验证我的邮箱 →',
    expiry: '此链接将在 24 小时后失效。如果这不是您本人的注册操作，请忽略此邮件。',
    afterIntro: '确认邮箱后，您将可以充分使用 TrouveTout224 的各项功能：',
    perk1: '免费发布广告',
    perk2: '联系卖家',
    perk3: '寻找工作、住房、车辆等更多信息',
  }),
};
