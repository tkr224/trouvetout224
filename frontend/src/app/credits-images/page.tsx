import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Camera } from 'lucide-react';
import imageCredits from '../../../scripts/image-credits.json';

const CATEGORY_LABELS: Record<string, string> = {
  telephones: 'Téléphones',
  informatique: 'Informatique',
  electronique: 'Électronique',
  vehicules: 'Véhicules',
  immobilier: 'Immobilier',
  terrains: 'Terrains',
  emplois: 'Emplois',
  services: 'Services',
  restaurants: 'Restaurants',
  hotels: 'Hôtels',
  mode: 'Mode',
  chaussures: 'Chaussures',
  beaute: 'Beauté',
  sante: 'Santé',
  formation: 'Formation',
  evenements: 'Événements',
  maison: 'Maison',
  agriculture: 'Agriculture',
  animaux: 'Animaux',
  sports: 'Sports',
  divers: 'Divers',
};

const LICENSE_URLS: Record<string, string> = {
  cc0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  by: 'https://creativecommons.org/licenses/by/2.0/',
  'by-sa': 'https://creativecommons.org/licenses/by-sa/2.0/',
};

const LICENSE_LABELS: Record<string, string> = {
  cc0: 'CC0 — Domaine public',
  by: 'CC BY 2.0',
  'by-sa': 'CC BY-SA 2.0',
};

export default function CreditsImagesPage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="card p-10">
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2 flex items-center gap-3">
            <Camera size={30} className="text-primary-700" /> Crédits photos
          </h1>
          <p className="text-dark-400 text-sm mb-8">
            Les photos illustrant les catégories de la page d'accueil proviennent de photographes qui les partagent sous licence libre (Creative Commons). Merci à eux.
          </p>
          <div className="space-y-4">
            {imageCredits.map((c) => (
              <div key={c.slug} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dark-100 pb-3">
                <div>
                  <p className="font-semibold text-dark-900">{CATEGORY_LABELS[c.slug] || c.slug}</p>
                  <p className="text-dark-400 text-xs">
                    Photo par{' '}
                    {c.creator_url ? (
                      <a href={c.creator_url} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">
                        {c.creator || 'auteur inconnu'}
                      </a>
                    ) : (
                      c.creator || 'auteur inconnu'
                    )}
                  </p>
                </div>
                <a
                  href={LICENSE_URLS[c.license] || c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-dark-500 hover:text-primary-700 whitespace-nowrap"
                >
                  {LICENSE_LABELS[c.license] || c.license}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
