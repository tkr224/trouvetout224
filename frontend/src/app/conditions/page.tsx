import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  FileText, CheckCircle2, UserCog, Ban, Megaphone, HandCoins,
  ShieldAlert, Mail, MessageCircle,
} from 'lucide-react';

const SECTIONS = [
  {
    icon: CheckCircle2,
    title: 'Acceptation des conditions',
    content: "En accédant à TrouveTout224, vous acceptez ces conditions d'utilisation. Si vous n'êtes pas d'accord, merci de ne pas utiliser la plateforme.",
  },
  {
    icon: UserCog,
    title: 'Utilisation du service',
    content: "TrouveTout224 est destiné aux résidents de Guinée. L'âge minimum est de 13 ans. Vous êtes responsable de la confidentialité de vos identifiants de connexion.",
  },
  {
    icon: Ban,
    title: 'Contenu interdit',
    content: "Il est interdit de publier tout contenu illégal, une arnaque, du contenu à caractère sexuel, violent, des armes, des drogues, ou tout ce qui viole les lois guinéennes.",
  },
  {
    icon: Megaphone,
    title: 'Annonces',
    content: "Publier une annonce est gratuit et sans limite. Les annonces doivent être véridiques et respecter les règles de la plateforme. Nous pouvons retirer toute annonce inappropriée, sans préavis.",
  },
  {
    icon: HandCoins,
    title: 'Transactions entre utilisateurs',
    content: "TrouveTout224 met en relation acheteurs et vendeurs, mais ne gère aucun paiement et n'est pas responsable des transactions. Rencontrez-vous dans un lieu public et vérifiez toujours le produit avant de payer.",
  },
  {
    icon: ShieldAlert,
    title: 'Suspension de compte',
    content: "Nous pouvons suspendre ou supprimer tout compte qui ne respecte pas ces conditions, sans préavis, afin de protéger la communauté.",
  },
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ConditionsPage() {
  const updatedAt = capitalize(new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-14 sm:py-16"
        style={{ background: 'linear-gradient(135deg, rgb(var(--p-900)) 0%, rgb(var(--p-800)) 55%, rgb(var(--p-900)) 100%)' }}
      >
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '50%', height: '120%', top: '-15%', right: '-15%',
            background: 'radial-gradient(ellipse, rgba(245,197,24,0.20) 0%, transparent 68%)',
            filter: 'blur(52px)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center" style={{ zIndex: 2 }}>
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-5">
            <FileText size={26} className="text-gold-300" />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-3" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
            Conditions d'utilisation
          </h1>
          <p className="text-white/90 text-base sm:text-lg mb-2" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
            Les règles simples qui font de TrouveTout224 un endroit sûr pour tous.
          </p>
          <p className="text-white/60 text-xs">Dernière mise à jour : {updatedAt}</p>
        </div>
      </section>

      {/* ══ SECTIONS ═══════════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-14 space-y-4">
        {SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="card p-6 sm:p-7 flex gap-4 items-start">
              <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-primary-700" />
              </div>
              <div>
                <h2 className="font-display font-bold text-dark-900 text-lg mb-1.5">{i + 1}. {section.title}</h2>
                <p className="text-dark-600 text-sm leading-relaxed">{section.content}</p>
              </div>
            </div>
          );
        })}

        {/* ══ CONTACT ═══════════════════════════════════════════════════ */}
        <div className="card p-8 text-center bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-800 border border-primary-200 dark:border-primary-800/40">
          <MessageCircle size={26} className="text-primary-700 mx-auto mb-3" />
          <p className="text-dark-700 font-semibold text-lg mb-2">Une question sur ces conditions ?</p>
          <p className="text-dark-500 text-sm mb-5">Notre équipe est là pour vous répondre.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="https://wa.me/224627543486" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a href="mailto:contact.trouvetout224@gmail.com" className="btn-outline inline-flex items-center gap-2">
              <Mail size={16} /> contact.trouvetout224@gmail.com
            </a>
          </div>
          <p className="text-dark-400 text-xs mt-4">
            Voir aussi notre <Link href="/confidentialite" className="text-primary-700 font-semibold hover:underline">Politique de confidentialité</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
