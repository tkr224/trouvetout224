import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="card p-10">
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">📄 Conditions d'utilisation</h1>
          <p className="text-dark-400 text-sm mb-8">Dernière mise à jour : Janvier 2024</p>
          <div className="space-y-8 text-dark-600">
            {[
              { title: '1. Acceptation des conditions', content: "En accédant à TrouveTout224, vous acceptez ces conditions d'utilisation. Si vous n'acceptez pas, veuillez ne pas utiliser la plateforme." },
              { title: '2. Utilisation du service', content: "TrouveTout224 est destiné aux résidents de Guinée. L'âge minimum est de 13 ans. Vous êtes responsable de la confidentialité de votre compte." },
              { title: '3. Contenu interdit', content: "Il est interdit de publier : contenu illégal, arnaques, nudité, violence, armes, drogues, ou tout contenu violant les lois guinéennes." },
              { title: '4. Annonces', content: "La publication d'annonces est gratuite et sans limite. Les annonces doivent être véridiques et conformes aux règles de la plateforme. Nous pouvons supprimer toute annonce inappropriée." },
              { title: '5. Transactions', content: "TrouveTout224 n'est pas responsable des transactions entre utilisateurs. Rencontrez les vendeurs dans des lieux publics et vérifiez les produits avant paiement." },
              { title: '6. Suspension', content: "Nous pouvons suspendre tout compte violant ces conditions, sans préavis." },
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