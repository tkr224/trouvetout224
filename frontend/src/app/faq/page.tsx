'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  HelpCircle, ChevronDown, MessageCircle, Wallet, ShieldAlert, BadgeCheck,
  Store, MapPin, KeyRound, Trash2, Flag, Megaphone, PackagePlus,
} from 'lucide-react';

type Faq = { q: string; a: string; icon: any };
type Category = { title: string; items: Faq[] };

const CATEGORIES: Category[] = [
  {
    title: 'Démarrer sur TrouveTout224',
    items: [
      {
        icon: Megaphone,
        q: 'TrouveTout224, c\'est vraiment gratuit ?',
        a: 'Oui, totalement. Publier une annonce, créer ta boutique et contacter les vendeurs ne coûte rien. Aucun frais caché.',
      },
      {
        icon: PackagePlus,
        q: 'Comment je publie une annonce ?',
        a: 'Clique sur "Publier une annonce" en haut du site, choisis une catégorie, ajoute des photos, un titre, une description, un prix et ta ville. C\'est prêt en quelques minutes.',
      },
      {
        icon: Store,
        q: 'Comment créer ma boutique ?',
        a: 'Va dans "Devenir vendeur" ou ton profil, puis "Créer ma boutique". Ajoute un nom, une photo et commence à publier tes articles — ils apparaîtront tous au même endroit, visibles par toute la Guinée.',
      },
      {
        icon: MapPin,
        q: 'Puis-je vendre partout en Guinée ?',
        a: 'Oui. Tu peux publier depuis n\'importe quelle ville — Conakry, Labé, Kindia, Kankan, Mamou, Boké, Faranah, Nzérékoré et plus — et les acheteurs peuvent filtrer par ville pour te trouver.',
      },
    ],
  },
  {
    title: 'Acheter et vendre en confiance',
    items: [
      {
        icon: MessageCircle,
        q: 'Comment les acheteurs me contactent ?',
        a: 'Directement sur WhatsApp ! Chaque annonce affiche un bouton pour écrire ou appeler le vendeur en un clic, sans passer par un intermédiaire.',
      },
      {
        icon: Wallet,
        q: 'Comment se passe le paiement ?',
        a: 'TrouveTout224 ne gère aucun paiement. L\'acheteur et le vendeur s\'arrangent directement entre eux, en personne, comme un achat classique. Nous mettons en relation, la transaction se passe entre vous.',
      },
      {
        icon: ShieldAlert,
        q: 'Comment éviter les arnaques ?',
        a: 'Quelques réflexes simples : rencontre-toi dans un lieu public et fréquenté, vérifie toujours le produit avant de payer, méfie-toi des prix trop beaux pour être vrais, et privilégie les vendeurs vérifiés (badge bleu). Ne fais jamais de virement avant d\'avoir vu l\'article.',
      },
      {
        icon: BadgeCheck,
        q: 'C\'est quoi un vendeur vérifié ?',
        a: 'C\'est un vendeur dont l\'identité a été contrôlée par notre équipe. Son profil affiche un badge de confiance, un gage de sérieux supplémentaire pour les acheteurs.',
      },
    ],
  },
  {
    title: 'Gérer mon compte',
    items: [
      {
        icon: KeyRound,
        q: 'J\'ai oublié mon mot de passe, que faire ?',
        a: 'Sur la page de connexion, clique sur "Mot de passe oublié", renseigne ton email et suis les instructions pour en choisir un nouveau.',
      },
      {
        icon: Trash2,
        q: 'Comment supprimer mon compte ou mon annonce ?',
        a: 'Pour une annonce : va dans Profil → Mes annonces → Supprimer. Pour ton compte : Paramètres → Confidentialité → Supprimer mon compte. L\'action est définitive.',
      },
      {
        icon: Flag,
        q: 'Comment signaler une annonce ou un utilisateur ?',
        a: 'Sur l\'annonce ou le profil concerné, clique sur "Signaler". Décris le problème et notre équipe l\'examine rapidement pour garder la plateforme saine.',
      },
    ],
  },
];

function FaqItem({ item }: { item: Faq }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  return (
    <div className="card dark:bg-dark-800 dark:border dark:border-dark-700 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 text-left p-5"
        aria-expanded={open}
      >
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-primary-700 dark:text-primary-400" />
        </div>
        <span className="flex-1 font-semibold text-dark-900 dark:text-white text-sm sm:text-base">{item.q}</span>
        <ChevronDown size={18} className={`text-dark-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 pl-[4.25rem] text-dark-600 dark:text-dark-300 text-sm leading-relaxed">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900">
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
            <HelpCircle size={26} className="text-gold-300" />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-3" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
            Questions fréquentes
          </h1>
          <p className="text-white/90 text-base sm:text-lg" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
            Tout ce qu'il faut savoir pour acheter et vendre sereinement sur TrouveTout224
          </p>
        </div>
      </section>

      {/* ══ CATÉGORIES DE QUESTIONS ═══════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-14 space-y-12">
        {CATEGORIES.map(cat => (
          <div key={cat.title}>
            <h2 className="text-lg sm:text-xl font-display font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="h-1 w-4 bg-primary-600 rounded-full inline-block" />
              {cat.title}
            </h2>
            <div className="space-y-3">
              {cat.items.map(item => (
                <FaqItem key={item.q} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ══ CONTACT SUPPORT ════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="card p-8 text-center bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-800 border border-primary-200 dark:border-primary-800/40">
          <p className="text-dark-700 dark:text-white font-semibold text-lg mb-2">Vous n'avez pas trouvé votre réponse ?</p>
          <p className="text-dark-500 dark:text-dark-400 text-sm mb-5">Notre équipe est disponible pour vous aider directement sur WhatsApp.</p>
          <a
            href="https://wa.me/224627543486"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <MessageCircle size={16} /> Contacter le support WhatsApp
          </a>
          <p className="text-dark-400 dark:text-dark-500 text-xs mt-4">
            Ou consultez notre <Link href="/aide" className="text-primary-700 dark:text-primary-400 font-semibold hover:underline">Centre d'aide</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
