import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo & description */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex shadow-sm relative">
                <div className="flex-1 bg-guinea-500" />
                <div className="flex-1 bg-gold-500" />
                <div className="flex-1 bg-primary-700" />
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow">TT</span>
              </div>
              <span className="font-display font-bold text-xl leading-none">
                <span className="text-guinea-500">Trouve</span>
                <span className="text-gold-400">Tout</span>
                <span className="text-primary-500">224</span>
              </span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed">
              La plus grande plateforme d'annonces et marketplace de Guinée. Achetez, vendez, trouvez un emploi ou un logement facilement.
            </p>
            <div className="flex gap-3 mt-4">
              {['📘', '📷', '🐦', '▶️'].map((icon, i) => (
                <button key={i} className="w-9 h-9 bg-dark-700 rounded-xl flex items-center justify-center hover:bg-primary-700 transition-colors text-sm">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Catégories */}
          <div>
            <h3 className="font-semibold text-white mb-4">Catégories</h3>
            <ul className="space-y-2 text-dark-400 text-sm">
              {['Téléphones', 'Véhicules', 'Immobilier', 'Emplois', 'Restaurants', 'Hôtels', 'Mode', 'Services'].map((cat) => (
                <li key={cat}>
                  <Link href={`/categories/${cat.toLowerCase()}`} className="hover:text-primary-400 transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Villes */}
          <div>
            <h3 className="font-semibold text-white mb-4">Villes</h3>
            <ul className="space-y-2 text-dark-400 text-sm">
              {['Conakry', 'Labé', 'Kindia', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'Nzérékoré'].map((v) => (
                <li key={v}>
                  <Link href={`/annonces/lister?city=${v}`} className="hover:text-primary-400 transition-colors">
                    📍 {v}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Infos */}
          <div>
            <h3 className="font-semibold text-white mb-4">TrouveTout224</h3>
            <ul className="space-y-2 text-dark-400 text-sm">
              {[
                { label: 'À propos', href: '/a-propos' },
                { label: 'Comment ça marche', href: '/aide' },
                { label: 'Publier une annonce', href: '/annonces/publier' },
                { label: 'Pack Premium', href: '/premium' },
                { label: 'Contact', href: '/contact' },
                { label: "Conditions d'utilisation", href: '/conditions' },
                { label: 'Politique de confidentialité', href: '/confidentialite' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-dark-500 text-sm">
          <p>© 2026 TrouveTout224 · Conakry, République de Guinée 🇬🇳</p>
          <p>Fait avec <span className="text-guinea-500">❤️</span> pour la Guinée</p>
        </div>
      </div>
    </footer>
  );
}