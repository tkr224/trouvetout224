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
          <p className="text-dark-400 text-sm mb-8">Dernière mise à jour : Juillet 2026</p>
          <div className="space-y-8 text-dark-600">
            {[
              { title: '1. Données collectées', content: "Nous collectons : les informations de votre compte (nom, email et/ou téléphone, ville, photo de profil), le contenu de vos annonces (titre, description, photos, prix), vos échanges dans la messagerie interne, ainsi que des données techniques de navigation (pages consultées, statistiques de visite anonymes)." },
              { title: '2. Connexion via Google', content: "Si vous vous connectez avec Google, nous recevons uniquement votre nom, votre adresse email et votre photo de profil, transmis directement par Google après votre autorisation. Nous ne recevons jamais votre mot de passe Google." },
              { title: '3. Utilisation des données', content: "Vos données servent à créer et sécuriser votre compte, afficher vos annonces, permettre la messagerie entre utilisateurs, vous envoyer des notifications utiles (email, in-app) et améliorer nos services." },
              { title: '4. Partage des données', content: "Nous ne vendons jamais vos données à des tiers. Vos coordonnées ne sont visibles par les autres utilisateurs que sur vos annonces, si vous choisissez de les y afficher." },
              { title: '5. Sécurité', content: "Vos mots de passe sont chiffrés (hachage bcrypt) et ne sont jamais stockés en clair. Toutes les communications avec le site passent par HTTPS." },
              { title: '6. Cookies et mesure d\'audience', content: "Nous utilisons des cookies techniques pour maintenir votre session connectée. Lorsqu'il est activé, Google Analytics peut collecter des statistiques de fréquentation anonymisées pour nous aider à améliorer le site. Vous pouvez désactiver les cookies non essentiels dans les réglages de votre navigateur." },
              { title: '7. Vos droits', content: "Vous pouvez accéder à vos données, les modifier ou supprimer votre compte à tout moment depuis vos paramètres. Pour toute demande spécifique (export, suppression complète), contactez-nous." },
              { title: '8. Contact', content: "Pour toute question relative à vos données personnelles : contact.trouvetout224@gmail.com" },
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