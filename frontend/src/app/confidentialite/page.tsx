import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  Lock, Database, Target, ShieldCheck, Share2, Cookie, UserCheck,
  MessageCircle, Mail, ImageIcon, Send, Chrome,
} from 'lucide-react';

const SECTIONS = [
  {
    icon: Database,
    title: 'Les données que nous collectons',
    items: [
      "Informations de compte : nom, prénom, email et/ou téléphone, ville, photo de profil.",
      "Contenu de vos annonces : titre, description, photos, prix, catégorie.",
      "Vos échanges dans la messagerie interne, pour assurer le suivi entre acheteurs et vendeurs.",
      "Vos réponses aux questions de sécurité, si vous les configurez (pour récupérer votre compte).",
      "Données techniques de navigation : pages consultées, statistiques de visite anonymisées.",
    ],
  },
  {
    icon: Target,
    title: 'Pourquoi nous les utilisons',
    items: [
      "Créer et sécuriser votre compte.",
      "Afficher vos annonces et vous mettre en relation avec les autres utilisateurs.",
      "Faire fonctionner la messagerie entre acheteurs et vendeurs.",
      "Vous envoyer des notifications utiles (email, dans l'application).",
      "Améliorer TrouveTout224 au fil du temps.",
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Comment elles sont protégées',
    items: [
      "Vos mots de passe et vos réponses aux questions de sécurité sont chiffrés (hachage) et ne sont jamais stockés ni lisibles en clair — même par notre équipe.",
      "Toutes les communications avec le site passent par une connexion sécurisée (HTTPS).",
      "L'accès à vos données est strictement limité aux besoins techniques du service.",
    ],
  },
  {
    icon: Share2,
    title: 'Avec qui elles sont partagées',
    items: [
      "Avec personne. Nous ne vendons et ne partageons jamais vos données à des fins publicitaires.",
      "Seuls des prestataires techniques indispensables au fonctionnement du site y ont accès, chacun uniquement pour ce qui le concerne.",
    ],
    partners: [
      { icon: ImageIcon, name: 'Cloudinary', role: "hébergement de vos photos (annonces, profil)" },
      { icon: Send,      name: 'Resend',     role: "envoi des emails (confirmation, notifications)" },
      { icon: Chrome,    name: 'Google',     role: "connexion sécurisée si vous choisissez « Se connecter avec Google »" },
    ],
  },
  {
    icon: Cookie,
    title: "Cookies et mesure d'audience",
    items: [
      "Des cookies techniques maintiennent votre session connectée — indispensables au fonctionnement du site.",
      "Lorsqu'il est activé, Google Analytics peut collecter des statistiques de fréquentation anonymisées, pour nous aider à améliorer le site.",
      "Vous pouvez désactiver les cookies non essentiels dans les réglages de votre navigateur à tout moment.",
    ],
  },
  {
    icon: UserCheck,
    title: 'Vos droits',
    items: [
      "Accéder à vos données depuis votre profil et vos paramètres, à tout moment.",
      "Modifier vos informations (nom, photo, ville, mot de passe...) directement dans Paramètres.",
      "Supprimer votre compte et vos données quand vous le souhaitez.",
      "Nous contacter pour toute demande particulière (export de données, question sur votre compte).",
    ],
  },
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ConfidentialitePage() {
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
            width: '50%', height: '120%', top: '-15%', left: '-15%',
            background: 'radial-gradient(ellipse, rgb(var(--p-600) / 0.45) 0%, transparent 68%)',
            filter: 'blur(52px)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center" style={{ zIndex: 2 }}>
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-5">
            <Lock size={26} className="text-gold-300" />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-3" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
            Politique de confidentialité
          </h1>
          <p className="text-white/90 text-base sm:text-lg mb-2" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
            Vos données vous appartiennent. Voici, en clair, ce que nous faisons — et ne faisons pas — avec elles.
          </p>
          <p className="text-white/60 text-xs">Dernière mise à jour : {updatedAt}</p>
        </div>
      </section>

      {/* ══ SECTIONS ═══════════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-14 space-y-5">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="card p-6 sm:p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary-700" />
                </div>
                <h2 className="font-display font-bold text-dark-900 text-lg">{section.title}</h2>
              </div>
              <ul className="space-y-2.5 pl-1">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-dark-600 text-sm leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {section.partners && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  {section.partners.map(p => (
                    <div key={p.name} className="bg-dark-50 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <p.icon size={16} className="text-primary-700" />
                      </div>
                      <p className="font-semibold text-dark-900 text-sm">{p.name}</p>
                      <p className="text-dark-500 text-xs leading-snug">{p.role}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* ══ CONTACT ═══════════════════════════════════════════════════ */}
        <div className="card p-8 text-center bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-800 border border-primary-200 dark:border-primary-800/40">
          <MessageCircle size={26} className="text-primary-700 mx-auto mb-3" />
          <p className="text-dark-700 font-semibold text-lg mb-2">Une question sur vos données ?</p>
          <p className="text-dark-500 text-sm mb-5">Écrivez-nous, nous répondons rapidement.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="https://wa.me/224627543486" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a href="mailto:contact.trouvetout224@gmail.com" className="btn-outline inline-flex items-center gap-2">
              <Mail size={16} /> contact.trouvetout224@gmail.com
            </a>
          </div>
          <p className="text-dark-400 text-xs mt-4">
            Voir aussi nos <Link href="/conditions" className="text-primary-700 font-semibold hover:underline">Conditions d'utilisation</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
