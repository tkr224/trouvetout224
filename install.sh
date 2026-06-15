#!/bin/bash
echo "🇬🇳 Installation de TrouveTout224..."
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js non trouvé. Installez Node.js 18+ depuis https://nodejs.org"
  exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Backend
echo ""
echo "📦 Installation des dépendances backend..."
cd backend && npm install
cp .env.example .env
echo "✅ Backend prêt"
echo "⚠️  Éditez backend/.env avec vos clés (DB, Cloudinary, Firebase...)"

# Frontend
echo ""
echo "📦 Installation des dépendances frontend..."
cd ../frontend && npm install
cp .env.local.example .env.local
echo "✅ Frontend prêt"
echo "⚠️  Éditez frontend/.env.local avec vos clés"

echo ""
echo "🎉 Installation terminée !"
echo ""
echo "ÉTAPES SUIVANTES:"
echo "1. Démarrez PostgreSQL et Redis (ou: docker-compose up -d)"
echo "2. Configurez backend/.env avec votre DATABASE_URL"
echo "3. cd backend && npx prisma migrate dev --name init"
echo "4. cd backend && npm run seed"
echo "5. cd backend && npm run dev  (port 5000)"
echo "6. cd frontend && npm run dev  (port 3000)"
echo ""
echo "🌍 Ouvrez http://localhost:3000"
echo "🔧 Admin: http://localhost:3000/admin"
echo "📚 API Docs: http://localhost:5000/api-docs"
