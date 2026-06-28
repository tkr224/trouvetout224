import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { rateLimit } from 'express-rate-limit';

import { prisma } from './config/database';
import { setupSocketIO } from './config/socket';
import { swaggerOptions } from './config/swagger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import annonceRoutes from './routes/annonce.routes';
import categoryRoutes from './routes/category.routes';
import cityRoutes from './routes/city.routes';
import messageRoutes from './routes/message.routes';
import jobRoutes from './routes/job.routes';
import restaurantRoutes from './routes/restaurant.routes';
import ratingRoutes from './routes/rating.routes';
import notificationRoutes from './routes/notification.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import reportRoutes from './routes/report.routes';
import uploadRoutes from './routes/upload.routes';
import savedSearchRoutes from './routes/saved-search.routes';
import publicationRoutes from './routes/publication.routes';
import onboardingRoutes from './routes/onboarding.routes';
import subscriptionRoutes from './routes/subscription.routes';
import configRoutes from './routes/config.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const isDev = process.env.NODE_ENV !== 'production';

// ============================
// MIDDLEWARES GLOBAUX
// ============================

// Helmet renforcé
app.use(helmet({
  // HSTS : forcer HTTPS pendant 2 ans
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },
  // Empêche le navigateur de deviner le MIME type
  noSniff: true,
  // Protection XSS navigateur (legacy mais utile)
  xssFilter: true,
  // Pas de header X-Powered-By (masque la techno)
  hidePoweredBy: true,
  // Empêche l'embarquement dans des iframes externes
  frameguard: { action: 'sameorigin' },
  // Referrer strict
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // CSP de base côté API (pas de HTML à protéger, mais bonne pratique)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Nécessaire pour les réponses JSON cross-origin
}));

app.use(compression());
app.use(morgan(isDev ? 'dev' : 'combined'));

// CORS strict : accepte uniquement le frontend déclaré
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://trouvetout224.site',
  'https://www.trouvetout224.site',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (Postman, curl en dev)
      if (!origin || isDev) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origine non autorisée : ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Secret'],
  })
);

// Limite la taille des corps de requête
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Rate Limiting global ────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 300,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health', // Ne pas limiter le health-check
});
app.use('/api/', globalLimiter);

// ── Rate Limiting strict sur les routes sensibles ───────────────────────
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: isDev ? 500 : 30,
  message: { error: 'Limite atteinte. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// Inscription (anti-création de comptes en masse)
app.use('/api/auth/register', strictLimiter);
// Signalements (anti-spam)
app.use('/api/reports', strictLimiter);

// ── Swagger — désactivé en production (évite l'exposition publique de l'API) ──
const swaggerDocs = swaggerJsDoc(swaggerOptions);
if (isDev) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
} else {
  // En production : accès Swagger uniquement avec le bon header interne
  app.use('/api-docs', (req, res, next) => {
    const key = req.headers['x-docs-key'];
    if (key && key === process.env.DOCS_KEY) return next();
    res.status(404).json({ error: 'Not found' });
  }, swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// ============================
// ROUTES API
// ============================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/site-config',  configRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'TrouveTout224 API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global — ne jamais exposer les détails en production
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // Erreur CORS : retourner 403 proprement
    if (err.message?.startsWith('Origine non autorisée')) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    // Erreur multer (type MIME invalide)
    if (err.message?.includes('non autorisé') || err.message?.includes('Type de fichier')) {
      return res.status(400).json({ error: err.message });
    }
    // En développement : log + détails ; en production : message générique uniquement
    if (isDev) {
      console.error('[ERREUR]', err.stack || err.message);
      return res.status(500).json({ error: 'Erreur interne du serveur', details: err.message });
    }
    // PRODUCTION : ne jamais révéler la stack trace ni err.message
    console.error('[ERREUR]', new Date().toISOString(), req.method, req.path, err.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
);

// ============================
// SOCKET.IO
// ============================
setupSocketIO(io);

// ============================
// DÉMARRAGE DU SERVEUR
// ============================
const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Base de données connectée');

    httpServer.listen(PORT, () => {
      console.log(`
🚀 TrouveTout224 API démarrée !
📡 Port: ${PORT}
🌍 URL: http://localhost:${PORT}
📚 Docs: http://localhost:${PORT}/api-docs
🔧 Environnement: ${process.env.NODE_ENV}
      `);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
}

bootstrap();

export { io };
