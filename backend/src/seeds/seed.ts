import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // ============================
  // VILLES
  // ============================
  const cities = [
    { name: 'Conakry', nameEn: 'Conakry', latitude: 9.5370, longitude: -13.6773 },
    { name: 'Labé', nameEn: 'Labé', latitude: 11.3181, longitude: -12.2846 },
    { name: 'Kindia', nameEn: 'Kindia', latitude: 10.0558, longitude: -12.8642 },
    { name: 'Kankan', nameEn: 'Kankan', latitude: 10.3851, longitude: -9.3055 },
    { name: 'Mamou', nameEn: 'Mamou', latitude: 10.3742, longitude: -12.0875 },
    { name: 'Boké', nameEn: 'Boké', latitude: 10.9408, longitude: -14.2969 },
    { name: 'Faranah', nameEn: 'Faranah', latitude: 10.0354, longitude: -10.7417 },
    { name: 'Nzérékoré', nameEn: 'Nzérékoré', latitude: 7.7562, longitude: -8.8179 },
  ];

  for (const city of cities) {
    await prisma.city.upsert({ where: { name: city.name }, update: {}, create: city });
  }
  console.log('✅ Villes créées');

  // ============================
  // CATÉGORIES
  // ============================
  const categories = [
    { nameFr: 'Téléphones', slug: 'telephones', icon: '📱', color: '#3B82F6', order: 1 },
    { nameFr: 'Informatique', slug: 'informatique', icon: '💻', color: '#8B5CF6', order: 2 },
    { nameFr: 'Électronique', slug: 'electronique', icon: '🔌', color: '#EC4899', order: 3 },
    { nameFr: 'Véhicules', slug: 'vehicules', icon: '🚗', color: '#F59E0B', order: 4 },
    { nameFr: 'Immobilier', slug: 'immobilier', icon: '🏠', color: '#10B981', order: 5 },
    { nameFr: 'Terrains', slug: 'terrains', icon: '🌍', color: '#6B7280', order: 6 },
    { nameFr: 'Emplois', slug: 'emplois', icon: '💼', color: '#0EA5E9', order: 7 },
    { nameFr: 'Services', slug: 'services', icon: '🔧', color: '#F97316', order: 8 },
    { nameFr: 'Restaurants', slug: 'restaurants', icon: '🍽️', color: '#EF4444', order: 9 },
    { nameFr: 'Hôtels', slug: 'hotels', icon: '🏨', color: '#A855F7', order: 10 },
    { nameFr: 'Mode', slug: 'mode', icon: '👗', color: '#EC4899', order: 11 },
    { nameFr: 'Chaussures', slug: 'chaussures', icon: '👟', color: '#14B8A6', order: 12 },
    { nameFr: 'Beauté', slug: 'beaute', icon: '💄', color: '#F43F5E', order: 13 },
    { nameFr: 'Santé', slug: 'sante', icon: '🏥', color: '#22C55E', order: 14 },
    { nameFr: 'Formation', slug: 'formation', icon: '🎓', color: '#3B82F6', order: 15 },
    { nameFr: 'Événements', slug: 'evenements', icon: '🎉', color: '#F59E0B', order: 16 },
    { nameFr: 'Maison', slug: 'maison', icon: '🛋️', color: '#84CC16', order: 17 },
    { nameFr: 'Agriculture', slug: 'agriculture', icon: '🌾', color: '#65A30D', order: 18 },
    { nameFr: 'Animaux', slug: 'animaux', icon: '🐾', color: '#FB923C', order: 19 },
    { nameFr: 'Sports', slug: 'sports', icon: '⚽', color: '#06B6D4', order: 20 },
    { nameFr: 'Divers', slug: 'divers', icon: '📦', color: '#9CA3AF', order: 21 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.nameFr, nameFr: cat.nameFr, slug: cat.slug, icon: cat.icon, color: cat.color, order: cat.order },
    });
  }
  console.log('✅ Catégories créées');

  // ============================
  // ADMIN PAR DÉFAUT
  // ============================
  const adminPassword = await bcrypt.hash('Admin@TrouveTout224!', 12);
  const conakry = await prisma.city.findUnique({ where: { name: 'Conakry' } });

  await prisma.user.upsert({
    where: { email: 'admin@trouvetout224.gn' },
    update: {},
    create: {
      email: 'admin@trouvetout224.gn',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'TrouveTout224',
      role: 'SUPER_ADMIN',
      isVerified: true,
      cityId: conakry?.id,
    },
  });
  console.log('✅ Admin créé: admin@trouvetout224.gn / Admin@TrouveTout224!');
  console.log('🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
