import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUBCATEGORIES: Record<string, { nameFr: string; slug: string; icon: string }[]> = {
  telephones: [
    { nameFr: 'Smartphones', slug: 'smartphones', icon: '📱' },
    { nameFr: 'Téléphones simples', slug: 'telephones-simples', icon: '☎️' },
    { nameFr: 'Tablettes', slug: 'tablettes', icon: '📲' },
    { nameFr: 'Accessoires téléphone', slug: 'accessoires-telephone', icon: '🔌' },
    { nameFr: 'Pièces & réparation', slug: 'pieces-telephone', icon: '🛠️' },
  ],
  informatique: [
    { nameFr: 'Ordinateurs portables', slug: 'ordinateurs-portables', icon: '💻' },
    { nameFr: 'Ordinateurs de bureau', slug: 'ordinateurs-bureau', icon: '🖥️' },
    { nameFr: 'Composants', slug: 'composants-pc', icon: '🧩' },
    { nameFr: 'Imprimantes', slug: 'imprimantes', icon: '🖨️' },
    { nameFr: 'Accessoires informatique', slug: 'accessoires-informatique', icon: '⌨️' },
  ],
  electronique: [
    { nameFr: 'Télévisions', slug: 'televisions', icon: '📺' },
    { nameFr: 'Audio & son', slug: 'audio-son', icon: '🔊' },
    { nameFr: 'Appareils photo', slug: 'appareils-photo', icon: '📷' },
    { nameFr: 'Consoles & jeux', slug: 'consoles-jeux', icon: '🎮' },
    { nameFr: 'Électroménager', slug: 'electromenager', icon: '🔌' },
  ],
  vehicules: [
    { nameFr: 'Voitures', slug: 'voitures', icon: '🚗' },
    { nameFr: 'Motos', slug: 'motos', icon: '🏍️' },
    { nameFr: 'Camions', slug: 'camions', icon: '🚚' },
    { nameFr: 'Pièces auto', slug: 'pieces-auto', icon: '⚙️' },
    { nameFr: 'Location de véhicules', slug: 'location-vehicules', icon: '🔑' },
  ],
  immobilier: [
    { nameFr: 'Appartements à louer', slug: 'appartements-louer', icon: '🏢' },
    { nameFr: 'Appartements à vendre', slug: 'appartements-vendre', icon: '🏬' },
    { nameFr: 'Maisons à louer', slug: 'maisons-louer', icon: '🏠' },
    { nameFr: 'Maisons à vendre', slug: 'maisons-vendre', icon: '🏡' },
    { nameFr: 'Bureaux & commerces', slug: 'bureaux-commerces', icon: '🏪' },
  ],
  terrains: [
    { nameFr: 'Terrains résidentiels', slug: 'terrains-residentiels', icon: '🏞️' },
    { nameFr: 'Terrains agricoles', slug: 'terrains-agricoles', icon: '🌾' },
    { nameFr: 'Terrains commerciaux', slug: 'terrains-commerciaux', icon: '🏗️' },
  ],
  emplois: [
    { nameFr: "Offres d'emploi", slug: 'offres-emploi', icon: '📋' },
    { nameFr: "Demandes d'emploi", slug: 'demandes-emploi', icon: '🙋' },
    { nameFr: 'Stages', slug: 'stages', icon: '🎓' },
    { nameFr: 'Freelance', slug: 'freelance', icon: '💻' },
  ],
  services: [
    { nameFr: 'Plomberie', slug: 'plomberie', icon: '🔧' },
    { nameFr: 'Électricité', slug: 'electricite', icon: '💡' },
    { nameFr: 'Ménage', slug: 'menage', icon: '🧹' },
    { nameFr: 'Transport & déménagement', slug: 'transport-demenagement', icon: '🚛' },
    { nameFr: 'Réparation', slug: 'reparation', icon: '🛠️' },
  ],
  restaurants: [
    { nameFr: 'Restaurants africains', slug: 'restaurants-africains', icon: '🍲' },
    { nameFr: 'Fast-food', slug: 'fast-food', icon: '🍔' },
    { nameFr: 'Pâtisseries', slug: 'patisseries', icon: '🧁' },
    { nameFr: 'Traiteurs', slug: 'traiteurs', icon: '🍽️' },
  ],
  hotels: [
    { nameFr: 'Hôtels', slug: 'hotels-etablissements', icon: '🏨' },
    { nameFr: 'Auberges', slug: 'auberges', icon: '🛏️' },
    { nameFr: 'Résidences meublées', slug: 'residences-meublees', icon: '🏠' },
  ],
  mode: [
    { nameFr: 'Vêtements femme', slug: 'vetements-femme', icon: '👗' },
    { nameFr: 'Vêtements homme', slug: 'vetements-homme', icon: '👔' },
    { nameFr: 'Vêtements enfant', slug: 'vetements-enfant', icon: '👶' },
    { nameFr: 'Sacs & maroquinerie', slug: 'sacs-maroquinerie', icon: '👜' },
    { nameFr: 'Montres & bijoux', slug: 'montres-bijoux', icon: '⌚' },
  ],
  chaussures: [
    { nameFr: 'Chaussures femme', slug: 'chaussures-femme', icon: '👠' },
    { nameFr: 'Chaussures homme', slug: 'chaussures-homme', icon: '👞' },
    { nameFr: 'Chaussures enfant', slug: 'chaussures-enfant', icon: '👟' },
    { nameFr: 'Sport', slug: 'chaussures-sport', icon: '👟' },
  ],
  beaute: [
    { nameFr: 'Maquillage', slug: 'maquillage', icon: '💄' },
    { nameFr: 'Soins de la peau', slug: 'soins-peau', icon: '🧴' },
    { nameFr: 'Parfums', slug: 'parfums', icon: '🌸' },
    { nameFr: 'Coiffure & perruques', slug: 'coiffure-perruques', icon: '💇' },
  ],
  sante: [
    { nameFr: 'Matériel médical', slug: 'materiel-medical', icon: '🩺' },
    { nameFr: 'Compléments & bien-être', slug: 'complements-bien-etre', icon: '💊' },
    { nameFr: 'Optique', slug: 'optique', icon: '👓' },
  ],
  formation: [
    { nameFr: 'Cours particuliers', slug: 'cours-particuliers', icon: '📚' },
    { nameFr: 'Formations en ligne', slug: 'formations-en-ligne', icon: '💻' },
    { nameFr: 'Langues', slug: 'langues', icon: '🗣️' },
    { nameFr: 'Informatique & code', slug: 'formation-informatique', icon: '⌨️' },
  ],
  evenements: [
    { nameFr: 'Mariages', slug: 'mariages', icon: '💍' },
    { nameFr: 'Location matériel', slug: 'location-materiel-event', icon: '🎪' },
    { nameFr: 'Animation & DJ', slug: 'animation-dj', icon: '🎧' },
    { nameFr: 'Décoration', slug: 'decoration-event', icon: '🎈' },
  ],
  maison: [
    { nameFr: 'Meubles', slug: 'meubles', icon: '🛋️' },
    { nameFr: 'Décoration', slug: 'decoration-maison', icon: '🖼️' },
    { nameFr: 'Cuisine & ustensiles', slug: 'cuisine-ustensiles', icon: '🍳' },
    { nameFr: 'Jardin', slug: 'jardin', icon: '🪴' },
  ],
  agriculture: [
    { nameFr: 'Matériel agricole', slug: 'materiel-agricole', icon: '🚜' },
    { nameFr: 'Semences & plants', slug: 'semences-plants', icon: '🌱' },
    { nameFr: 'Récoltes & produits', slug: 'recoltes-produits', icon: '🌾' },
    { nameFr: 'Bétail', slug: 'betail', icon: '🐄' },
  ],
  animaux: [
    { nameFr: 'Chiens', slug: 'chiens', icon: '🐕' },
    { nameFr: 'Chats', slug: 'chats', icon: '🐈' },
    { nameFr: 'Volaille', slug: 'volaille', icon: '🐔' },
    { nameFr: 'Accessoires animaux', slug: 'accessoires-animaux', icon: '🦴' },
  ],
  sports: [
    { nameFr: 'Équipement fitness', slug: 'equipement-fitness', icon: '🏋️' },
    { nameFr: 'Vélos', slug: 'velos', icon: '🚲' },
    { nameFr: 'Football', slug: 'football', icon: '⚽' },
    { nameFr: 'Autres sports', slug: 'autres-sports', icon: '🏀' },
  ],
  divers: [
    { nameFr: 'Livres', slug: 'livres', icon: '📚' },
    { nameFr: 'Jouets', slug: 'jouets', icon: '🧸' },
    { nameFr: 'Objets de collection', slug: 'objets-collection', icon: '🏺' },
    { nameFr: 'Autres', slug: 'autres-divers', icon: '📦' },
  ],
};

async function main() {
  console.log('🌱 Ajout des sous-catégories...');

  for (const [parentSlug, subs] of Object.entries(SUBCATEGORIES)) {
    const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
    if (!parent) {
      console.log(`⚠️  Catégorie parent introuvable: ${parentSlug}`);
      continue;
    }

    let order = 1;
    for (const sub of subs) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { parentId: parent.id },
        create: {
          name: sub.nameFr,
          nameFr: sub.nameFr,
          slug: sub.slug,
          icon: sub.icon,
          color: parent.color,
          parentId: parent.id,
          order: order++,
        },
      });
    }
    console.log(`✅ ${subs.length} sous-catégories pour ${parent.nameFr}`);
  }

  console.log('🎉 Sous-catégories ajoutées avec succès !');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());