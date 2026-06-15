# TrouveTout224 🇬🇳
> La plus grande plateforme d'annonces et marketplace de Guinée

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Base de données | PostgreSQL + Prisma ORM |
| Auth | JWT + Refresh Tokens |
| Images | Cloudinary |
| Notifications | Firebase Cloud Messaging |
| Mobile | React Native (Expo) |
| Cache | Redis |
| Paiements | Orange Money, Wave, Mobile Money |

---

## Structure du Projet

```
trouveTout224/
├── frontend/          → Next.js App
├── backend/           → API REST Node.js
├── mobile/            → React Native (Expo)
└── README.md
```

---

## 🚀 Installation & Déploiement

### Prérequis
- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7
- Compte Cloudinary
- Compte Firebase
- Git

---

### 1. Cloner le projet
```bash
git clone https://github.com/ton-repo/trouveTout224.git
cd trouveTout224
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

Remplir le `.env` :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/trouveTout224"
JWT_SECRET="ton_jwt_secret_tres_long_et_securise"
JWT_REFRESH_SECRET="ton_refresh_secret"
CLOUDINARY_CLOUD_NAME="ton_cloud_name"
CLOUDINARY_API_KEY="ta_cle_api"
CLOUDINARY_API_SECRET="ton_secret"
FIREBASE_PROJECT_ID="ton_projet_firebase"
REDIS_URL="redis://localhost:6379"
PORT=5000
NODE_ENV=development
```

```bash
# Créer la base de données
npx prisma migrate dev --name init

# Seeder les données initiales (catégories, villes)
npx ts-node src/seeds/seed.ts

# Démarrer le backend
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install

cp .env.local.example .env.local
```

Remplir `.env.local` :
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FIREBASE_API_KEY="ta_cle_firebase"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ton-projet.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ton_projet"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="ton_cloud"
NEXTAUTH_SECRET="ton_nextauth_secret"
NEXTAUTH_URL=http://localhost:3000
```

```bash
npm run dev
```

Frontend disponible sur : http://localhost:3000

---

### 4. Mobile Setup (Expo)

```bash
cd mobile
npm install
npx expo start
```

---

### 5. Déploiement Production

#### Backend (Railway / Render)
```bash
cd backend
npm run build
# Déployer le dossier dist/ sur Railway ou Render
```

#### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel deploy
```

#### Base de données (Supabase ou Railway)
```bash
npx prisma migrate deploy
```

---

## URLs importantes
- Frontend : http://localhost:3000
- Backend API : http://localhost:5000/api
- Admin Dashboard : http://localhost:3000/admin
- API Docs (Swagger) : http://localhost:5000/api-docs

---

## Fonctionnalités principales
- ✅ Inscription / Connexion (Email, Tel, Google, Facebook)
- ✅ Publication d'annonces avec photos
- ✅ Messagerie temps réel
- ✅ Système d'emplois avec CV
- ✅ Pages restaurants et hôtels
- ✅ Filtres par ville (8 villes de Guinée)
- ✅ Système de notes et avis
- ✅ Paiements Orange Money / Wave
- ✅ Dashboard Admin complet
- ✅ Notifications push (Firebase)
- ✅ Multilingue (FR / EN / AR)
- ✅ Responsive (Mobile, Tablette, Desktop)
