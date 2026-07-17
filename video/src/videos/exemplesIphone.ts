/**
 * Contenu d'exemple pour la variante "iPhone" du mockup téléphone.
 * Utilisé par la composition "PromoIphone" (voir Composition.tsx).
 */
import { Exemples } from '../types';

export const exemplesIphone: Exemples = {
  recherche: {
    requete: 'iPhone 13 Pro',
    resultats: [
      { titre: 'iPhone 13 Pro Max 256Go', prix: '4 500 000 GNF', lieu: 'Conakry, Kaloum', emoji: '📱' },
      { titre: 'Samsung Galaxy S22', prix: '3 200 000 GNF', lieu: 'Conakry, Ratoma', emoji: '📱' },
    ],
  },
  categories: [
    { emoji: '📱', label: 'Téléphones' },
    { emoji: '🚗', label: 'Véhicules' },
    { emoji: '🏠', label: 'Immobilier' },
    { emoji: '💼', label: 'Emplois' },
    { emoji: '🔧', label: 'Services' },
    { emoji: '🍽️', label: 'Restaurants' },
    { emoji: '👗', label: 'Mode' },
    { emoji: '🛋️', label: 'Maison' },
  ],
  annonce: {
    titre: 'iPhone 13 Pro Max 256Go',
    prix: '4 500 000 GNF',
    lieu: 'Conakry, Kaloum',
    vendeur: 'Mamadou D.',
    emoji: '📱',
  },
};
