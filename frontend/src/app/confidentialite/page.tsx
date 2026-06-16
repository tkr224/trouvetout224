import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Lock } from 'lucide-react';

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="card p-10">
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2 flex items-center gap-3"><Lock size={30} className="text-primary-700" /> Politique de confidentialité</h1>
          <p className="text-dark-400 text-sm mb-8">Dernière mise à jour : Janvier 2024</p>
          <div className="space-y-8 text-dark-600">
            {[
              { title: '1. Données collectées', content: "Nous collectons : nom, email, téléphone, ville et les informations de vos annonces." },
              { title: '2. Utilisation des données', content: "Vos données servent à gérer votre compte, afficher vos annonces, vous envoyer des notifications et améliorer nos services." },
              { title: '3. Partage des données', content: "Nous ne vendons jamais vos données. Vos coordonnées sont visibles uniquement sur vos annonces si vous le choisissez." },
              { title: '4. Sécurité', content: "Vos mots de passe sont cryptés. Nous utilisons HTTPS pour toutes les communications." },
              { title: '5. Cookies', content: "Nous utilisons des cookies pour maintenir votre session. Vous pouvez les désactiver dans votre navigateur." },
              { title: '6. Vos droits', content: "Vous pouvez accéder, modifier ou supprimer vos données à tout moment depuis vos paramètres." },
              { title: '7. Contact', content: "Pour toute question : contact.trouvetout224@gmail.com" },
            ].map((section, i) => (
              <div key={i}>
                <h2 className="font-display font-bold text-dark-900 text-lg mb-2">{section.title}</h2>
                <p className="leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}