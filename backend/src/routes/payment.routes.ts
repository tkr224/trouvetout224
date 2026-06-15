import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
const router = Router();

// Initier un paiement premium (10 000 GNF = 5 annonces supplémentaires)
router.post('/initiate', authenticate, async (req: any, res) => {
  try {
    const { method } = req.body; // ORANGE_MONEY | WAVE | MOBILE_MONEY
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
    // Ici tu intègres l'API Orange Money / Wave pour rediriger le paiement
    res.json({
      message: 'Paiement initié.',
      reference,
      paymentId: payment.id,
      instructions: `Payez 10 000 GNF via ${method} avec la référence ${reference}`,
    });
  } catch { res.status(500).json({ error: 'Erreur de paiement.' }); }
});

// Webhook confirmation paiement (appelé par Orange Money / Wave)
router.post('/webhook', async (req, res) => {
  try {
    const { reference, status } = req.body;
    await prisma.payment.updateMany({
      where: { reference },
      data: { status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED' },
    });
    res.json({ received: true });
  } catch { res.status(500).json({ error: 'Erreur webhook.' }); }
});

router.get('/history', authenticate, async (req: any, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: payments });
});

export default router;
