import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const router = Router();

// ── Méthodes de paiement autorisées ────────────────────────────────────
const ALLOWED_METHODS = ['ORANGE_MONEY', 'WAVE', 'MOBILE_MONEY'];

// ── Validation signature webhook (protection anti-fraude) ───────────────
// Le prestataire de paiement (Orange Money / Wave) envoie ce header.
// Configurer WEBHOOK_SECRET dans le tableau de bord du prestataire.
function verifyWebhookSignature(req: any): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  // Si aucun secret configuré en production : bloquer par précaution
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const incoming = req.headers['x-webhook-secret'] as string | undefined;
  if (!incoming) return false;
  // Comparaison en temps constant pour éviter les timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(incoming),
      Buffer.from(secret)
    );
  } catch {
    return false;
  }
}

// ── Rate limiter spécifique paiements ───────────────────────────────────
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  message: { error: 'Trop de tentatives de paiement. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Initier un paiement ─────────────────────────────────────────────────
router.post('/initiate', authenticate, paymentLimiter, async (req: any, res) => {
  try {
    const { method } = req.body;

    if (!method || !ALLOWED_METHODS.includes(method)) {
      return res.status(400).json({ error: 'Méthode de paiement invalide.' });
    }

    const reference = `TT224-${uuidv4().split('-')[0].toUpperCase()}`;
    const payment = await prisma.payment.create({
      data: {
        userId: req.userId,
        amount: 10000,
        currency: 'GNF',
        method,
        reference,
        status: 'PENDING',
        description: 'Pack Premium - 5 annonces supplémentaires',
      },
    });

    res.json({
      message: 'Paiement initié.',
      reference,
      paymentId: payment.id,
      instructions: `Payez 10 000 GNF via ${method} avec la référence ${reference}`,
    });
  } catch {
    res.status(500).json({ error: 'Erreur de paiement.' });
  }
});

// ── Webhook confirmation paiement (appelé par Orange Money / Wave) ──────
// SÉCURITÉ : Vérifie la signature avant toute mise à jour en base.
router.post('/webhook', async (req, res) => {
  try {
    // 1. Vérification de la signature
    if (!verifyWebhookSignature(req)) {
      console.warn(`[SÉCURITÉ] Tentative webhook non autorisée depuis ${req.ip}`);
      return res.status(401).json({ error: 'Signature webhook invalide.' });
    }

    const { reference, status } = req.body;

    // 2. Validation des champs
    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({ error: 'Référence manquante.' });
    }
    if (!['SUCCESS', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }
    // Format de référence attendu : TT224-XXXXXXXX
    if (!/^TT224-[A-Z0-9]{6,12}$/.test(reference)) {
      return res.status(400).json({ error: 'Format de référence invalide.' });
    }

    // 3. Vérifier que le paiement existe et est en attente
    const payment = await prisma.payment.findFirst({
      where: { reference, status: 'PENDING' },
    });
    if (!payment) {
      // Pas de détails sur la raison (évite de révéler l'état interne)
      return res.status(200).json({ received: true });
    }

    // 4. Mise à jour atomique (seulement si PENDING)
    await prisma.payment.updateMany({
      where: { reference, status: 'PENDING' },
      data: { status },
    });

    res.json({ received: true });
  } catch {
    res.status(500).json({ error: 'Erreur webhook.' });
  }
});

router.get('/history', authenticate, async (req: any, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: payments });
});

export default router;
