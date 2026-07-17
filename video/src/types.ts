/**
 * Types partagés pour le contenu d'exemple affiché dans le mockup
 * téléphone (scène 3). Utilisés par les fichiers de src/videos/ et
 * par les composants src/components/ecrans/.
 */

export type Resultat = { titre: string; prix: string; lieu: string; emoji: string };
export type Categorie = { emoji: string; label: string };
export type Annonce = { titre: string; prix: string; lieu: string; vendeur: string; emoji: string };

export type Exemples = {
  recherche: { requete: string; resultats: Resultat[] };
  categories: Categorie[];
  annonce: Annonce;
};
