import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { checkAnnonceAutoHide, checkDemandeAutoHide, checkDemandeResponseAutoHide, recomputeSellerScore } from '../services/ranking/jobs';
const router = Router();

const REASONS = ['SPAM', 'SCAM', 'INAPPROPRIATE_CONTENT', 'NUDITY', 'VIOLENCE', 'FAKE_AD', 'FORBIDDEN_PRODUCT', 'SUSPICIOUS_PRICE', 'DUPLICATE', 'OTHER'];

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { reason, description, reportedUserId, annonceId, demandeId, demandeResponseId } = req.body;
    if (!REASONS.includes(reason)) return res.status(400).json({ error: 'Motif invalide.' });
    if (!reportedUserId && !annonceId && !demandeId && !demandeResponseId) return res.status(400).json({ error: 'Cible du signalement manquante.' });

    // On ne peut pas se signaler soi-même (sinon un vendeur pourrait fausser le malus)
    const ownerId = annonceId
      ? (await prisma.annonce.findUnique({ where: { id: annonceId }, select: { userId: true } }))?.userId
      : demandeId
        ? (await prisma.demande.findUnique({ where: { id: demandeId }, select: { userId: true } }))?.userId
        : demandeResponseId
          ? (await prisma.demandeResponse.findUnique({ where: { id: demandeResponseId }, select: { userId: true } }))?.userId
          : reportedUserId;
    if (!ownerId) return res.status(404).json({ error: 'Contenu introuvable.' });
    if (ownerId === req.userId) return res.status(400).json({ error: 'Tu ne peux pas signaler ton propre contenu.' });

    // Un même utilisateur ne compte qu'une fois par contenu (signalement en attente)
    const duplicate = await prisma.report.findFirst({
      where: {
        reportedById: req.userId, status: 'PENDING',
        annonceId: annonceId || null, demandeId: demandeId || null, demandeResponseId: demandeResponseId || null,
        ...(annonceId || demandeId || demandeResponseId ? {} : { reportedUserId }),
      },
      select: { id: true },
    });
    if (duplicate) return res.status(200).json({ message: 'Tu as déjà signalé ce contenu. Notre équipe va examiner.' });

    const report = await prisma.report.create({
      data: {
        reason, description: description ? String(description).slice(0, 1000) : null, reportedById: req.userId,
        reportedUserId: reportedUserId || null, annonceId: annonceId || null,
        demandeId: demandeId || null, demandeResponseId: demandeResponseId || null,
      },
    });
    res.status(201).json({ message: 'Signalement envoyé. Notre équipe va examiner.', data: { id: report.id } });

    // Malus progressif + masquage automatique (non bloquant)
    setImmediate(async () => {
      try {
        if (annonceId) await checkAnnonceAutoHide(annonceId);
        else if (demandeId) await checkDemandeAutoHide(demandeId);
        else if (demandeResponseId) await checkDemandeResponseAutoHide(demandeResponseId);
        else await recomputeSellerScore(ownerId);
      } catch (e) { console.error('[report] auto-modération:', e); }
    });
  } catch (e) { console.error('Erreur création signalement:', e); res.status(500).json({ error: 'Erreur.' }); }
});

export default router;
