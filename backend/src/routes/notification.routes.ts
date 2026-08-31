import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ data: notifs });
  } catch (e) {
    console.error('Erreur liste notifications:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.get('/unread-count', authenticate, async (req: any, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.userId, isRead: false },
    });
    res.json({ count });
  } catch {
    res.json({ count: 0 });
  }
});

router.put('/read-all', authenticate, async (req: any, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.userId, isRead: false }, data: { isRead: true } });
    res.json({ message: 'Notifications marquées comme lues.' });
  } catch (e) {
    console.error('Erreur lecture notifications:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.put('/:id/read', authenticate, async (req: any, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { isRead: true },
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Notification introuvable.' });
    }
    res.json({ message: 'OK' });
  } catch (e) {
    console.error('Erreur lecture notification:', e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
