# 🚀 Guide de Déploiement - TrouveTout224

## Déploiement Production Recommandé

| Service | Plateforme | Gratuit |
|---------|-----------|---------|
| Backend API | Railway.app ou Render.com | ✅ |
| Frontend | Vercel.com | ✅ |
| Base de données | Railway PostgreSQL ou Supabase | ✅ |
| Redis | Railway Redis | ✅ |
| Images | Cloudinary | ✅ |
| Notifications | Firebase | ✅ |

---

## 1. Base de données PostgreSQL (Railway)

1. Créez un compte sur railway.app
2. New Project → Add PostgreSQL
3. Copiez le `DATABASE_URL` dans votre `.env`

---

## 2. Backend sur Railway

```bash
# Dans le dossier backend
npm run build

# Sur Railway:
# New Project → Deploy from GitHub repo
# Root Directory: backend
# Start Command: node dist/index.js
# Ajoutez toutes les variables d'environnement
```

---

## 3. Frontend sur Vercel

```bash
# Installez Vercel CLI
npm i -g vercel

cd frontend
vercel

# Ajoutez les variables d'environnement dans Vercel Dashboard:
# NEXT_PUBLIC_API_URL = https://votre-backend.railway.app/api
```

---

## 4. Cloudinary (Images)

1. Créez un compte sur cloudinary.com
2. Dashboard → API Keys
3. Copiez `cloud_name`, `api_key`, `api_secret` dans `.env`

---

## 5. Firebase (Notifications Push)

1. console.firebase.google.com
2. Nouveau projet → "TrouveTout224"
3. Paramètres → Comptes de service → Générer une clé privée
4. Copiez les valeurs dans `.env`

---

## 6. Variables d'environnement Production

### Backend (Railway)
```
DATABASE_URL=postgresql://...
JWT_SECRET=votre_secret_tres_long_production
JWT_REFRESH_SECRET=autre_secret_tres_long
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
FIREBASE_PROJECT_ID=xxx
NODE_ENV=production
FRONTEND_URL=https://trouvetout224.vercel.app
PORT=5000
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://votre-api.railway.app/api
```

---

## Checklist avant mise en production

- [ ] Variables d'environnement configurées
- [ ] Base de données migrée (`prisma migrate deploy`)
- [ ] Seed exécuté (`npm run seed`)
- [ ] Cloudinary configuré (test upload)
- [ ] Firebase configuré (test notification)
- [ ] Admin créé et testé
- [ ] SSL/HTTPS activé (automatique sur Railway/Vercel)
- [ ] Domaine personnalisé configuré (trouvetout224.gn)

---

## Domaine personnalisé

1. Achetez le domaine `trouvetout224.gn` auprès d'un registrar
2. Sur Vercel: Settings → Domains → Add `trouvetout224.gn`
3. Sur Railway: Settings → Domains → Add `api.trouvetout224.gn`
4. Configurez les DNS chez votre registrar
