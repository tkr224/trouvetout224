import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { HelpCircle, Mail } from 'lucide-react';

const FAQS = [
  { q: 'Comment publier une annonce ?', a: 'Cliquez sur "Publier" dans la barre de navigation, remplissez le formulaire avec titre, description, prix, photos et coordonnées.' },
  { q: 'La publication est-elle vraiment gratuite ?', a: 'Oui, la publication est 100% gratuite et sans limite. Vous pouvez publier autant d\'annonces que vous le souhaitez.' },
  { q: 'Comment contacter un vendeur ?', a: 'Sur une annonce, cliquez sur "Envoyer un message" ou sur les boutons Appeler/WhatsApp.' },
  { q: 'Comment signaler une fraude ?', a: 'Sur l\'annonce, cliquez sur "Signaler cette annonce". Notre équipe examine sous 24h.' },
  { q: 'Comment supprimer mon annonce ?', a: 'Profil → Mes annonces → cliquez sur l\'annonce → Supprimer.' },
  { q: 'Comment changer ma ville ?', a: 'Cliquez sur le nom de la ville dans la barre de navigation et choisissez la vôtre.' },
];

export default function AidePage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-dark-900 mb-3 flex items-center justify-center gap-3"><HelpCircle size={36} className="text-primary-700" /> Centre d'aide</h1>
          <p className="text-dark-500">Trouvez rapidement des réponses à vos questions</p>
        </div>
        <h2 className="text-2xl font-display font-bold text-dark-900 mb-6">Questions fréquentes</h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <details key={i} className="card p-5 cursor-pointer group">
              <summary className="font-semibold text-dark-900 flex items-center justify-between list-none">
                {faq.q}
                <span className="text-primary-700 text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-dark-600 text-sm mt-3 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="card p-8 mt-10 text-center bg-primary-50 border border-primary-200">
          <p className="text-dark-700 font-semibold mb-2">Vous n'avez pas trouvé votre réponse ?</p>
          <Link href="/contact" className="btn-primary inline-flex items-center gap-2 mt-2"><Mail size={15} /> Contacter le support</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}