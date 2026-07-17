/**
 * Contenu d'exemple pour la variante "Voiture" du mockup téléphone.
 * Utilisé par la composition "PromoVoiture" (voir Composition.tsx).
 *
 * C'est un exemple de nouvelle variante : copie ce fichier, change les
 * valeurs, ajoute une <Composition> dans Composition.tsx qui pointe
 * dessus (voir comment "PromoVoiture" est déclarée) et tu as une
 * nouvelle vidéo, sans toucher au reste du code.
 */
import { Exemples } from '../types';

export const exemplesVoiture: Exemples = {
  recherche: {
    requete: 'Toyota Corolla 2018',
    resultats: [
      { titre: 'Toyota Corolla 2018', prix: '85 000 000 GNF', lieu: 'Conakry, Dixinn', emoji: '🚗' },
      { titre: 'Hyundai Tucson 2020', prix: '120 000 000 GNF', lieu: 'Conakry, Matam', emoji: '🚙' },
    ],
  },
  categories: [
    { emoji: '🚗', label: 'Véhicules' },
    { emoji: '📱', label: 'Téléphones' },
    { emoji: '🏠', label: 'Immobilier' },
    { emoji: '💼', label: 'Emplois' },
    { emoji: '🔧', label: 'Services' },
    { emoji: '🍽️', label: 'Restaurants' },
    { emoji: '👗', label: 'Mode' },
    { emoji: '🛋️', label: 'Maison' },
  ],
  annonce: {
    titre: 'Toyota Corolla 2018',
    prix: '85 000 000 GNF',
    lieu: 'Conakry, Dixinn',
    vendeur: 'Ibrahima S.',
    emoji: '🚗',
  },
};
