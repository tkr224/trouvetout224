import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { io } from '../index';

const router = Router();

// Vrai si l'un des deux utilisateurs a bloqué l'autre (dans n'importe quel sens)
async function isBlockedPair(userIdA: string, userIdB: string): Promise<boolean> {
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockedById: userIdA, blockedId: userIdB },
        { blockedById: userIdB, blockedId: userIdA },
      ],
    },
    select: { id: true },
  });
  return !!blocked;
}

// Nombre total de messages non lus (pour le badge de la navbar)
router.get('/unread-count', authenticate, async (req: any, res) => {
  try {
    const count = await prisma.message.count({
      where: {
        senderId: { not: req.userId },
        isRead: false,
        deletedForAll: false,
        conversation: { participants: { some: { id: req.userId } } },
      },
    });
    res.json({ count });
  } catch {
    res.json({ count: 0 });
  }
});

// Toutes les conversations (optimisé : comptage non-lus en 1 seule requête)
router.get('/conversations', authenticate, async (req: any, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { id: req.userId } } },
      include: {
        participants: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        annonce: { select: { id: true, slug: true, title: true, price: true, currency: true, images: { take: 1 } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Compter TOUS les non-lus en une seule requête groupée
    const unreadGroups = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        senderId: { not: req.userId },
        isRead: false,
        deletedForAll: false,
        conversationId: { in: conversations.map(c => c.id) },
      },
      _count: { id: true },
    });

    const unreadMap = new Map(unreadGroups.map(g => [g.conversationId, g._count.id]));
    const withUnread = conversations.map(conv => ({ ...conv, unreadCount: unreadMap.get(conv.id) || 0 }));

    res.json({ data: withUnread });
  } catch (e) {
    console.error('Erreur conversations:', e);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Messages d'une conversation
router.get('/conversations/:id/messages', authenticate, async (req: any, res) => {
  try {
    const membership = await prisma.conversation.findFirst({
      where: { id: req.params.id, participants: { some: { id: req.userId } } },
      select: { id: true },
    });
    if (!membership) return res.status(403).json({ error: 'Accès refusé.' });

    // Charge les N derniers messages (les plus récents), remis dans l'ordre chronologique.
    // `before` (id d'un message) permet de charger la page précédente, plus ancienne.
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
    const beforeId = req.query.before as string | undefined;
    let beforeDate: Date | undefined;
    if (beforeId) {
      const beforeMsg = await prisma.message.findUnique({ where: { id: beforeId }, select: { createdAt: true } });
      beforeDate = beforeMsg?.createdAt;
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: req.params.id,
        ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
      },
      include: {
        sender: { select: { id: true, firstName: true, avatar: true } },
        replyTo: { select: { id: true, content: true, imageUrl: true, sender: { select: { firstName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    messages.reverse();

    const visible = messages.filter(m => !m.deletedFor.includes(req.userId));

    await prisma.message.updateMany({
      where: { conversationId: req.params.id, senderId: { not: req.userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    io.to(`conversation:${req.params.id}`).emit('messages_read', { conversationId: req.params.id, readBy: req.userId });
    res.json({ data: visible });
  } catch (e) {
    console.error('Erreur messages:', e);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Créer/ouvrir une conversation
router.post('/conversations', authenticate, async (req: any, res) => {
  try {
    const { recipientId, annonceId } = req.body;
    if (recipientId === req.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous envoyer un message.' });
    }

    if (await isBlockedPair(req.userId, recipientId)) {
      return res.status(403).json({ error: 'Impossible de contacter cet utilisateur.' });
    }

    const allConvs = await prisma.conversation.findMany({
      where: {
        AND: [
          { participants: { some: { id: req.userId } } },
          { participants: { some: { id: recipientId } } },
        ],
      },
      include: { participants: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    });

    const existing = allConvs.find(c => c.participants.length === 2);
    if (existing) return res.json({ data: existing });

    const conversation = await prisma.conversation.create({
      data: {
        annonceId: annonceId || undefined,
        participants: { connect: [{ id: req.userId }, { id: recipientId }] },
      },
      include: {
        participants: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        annonce: { select: { id: true, slug: true, title: true, price: true, currency: true, images: { take: 1 } } },
      },
    });
    res.status(201).json({ data: conversation });
  } catch (e) {
    console.error('Erreur create conversation:', e);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Envoyer un message (avec reply optionnel)
router.post('/conversations/:id/messages', authenticate, async (req: any, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, participants: { some: { id: req.userId } } },
      include: { participants: { select: { id: true } } },
    });
    if (!conversation) return res.status(403).json({ error: 'Accès refusé.' });

    const recipient = conversation.participants.find(p => p.id !== req.userId);
    if (recipient && await isBlockedPair(req.userId, recipient.id)) {
      return res.status(403).json({ error: 'Impossible d\'envoyer un message à cet utilisateur.' });
    }

    const { content, imageUrl, replyToId } = req.body;
    if (!content && !imageUrl) return res.status(400).json({ error: 'Message vide.' });

    const message = await prisma.message.create({
      data: { conversationId: req.params.id, senderId: req.userId, content, imageUrl, replyToId: replyToId || undefined },
      include: {
        sender: { select: { id: true, firstName: true, avatar: true } },
        replyTo: { select: { id: true, content: true, imageUrl: true, sender: { select: { firstName: true } } } },
      },
    });
    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { lastMessage: content || '📷 Photo', lastMessageAt: new Date() },
    });

    io.to(`conversation:${req.params.id}`).emit('new_message', message);

    if (recipient) {
      io.to(`user:${recipient.id}`).emit('message_notification', {
        conversationId: req.params.id,
        message,
        senderName: message.sender.firstName,
      });
      try {
        await prisma.notification.create({
          data: {
            userId: recipient.id,
            type: 'NEW_MESSAGE',
            title: 'Nouveau message',
            body: `${message.sender.firstName} vous a envoyé un message`,
            data: { conversationId: req.params.id },
          },
        });
      } catch {}
    }

    res.status(201).json({ data: message });
  } catch (e) {
    console.error('Erreur envoi message:', e);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Supprimer un message (pour moi ou pour tous)
router.delete('/msg/:id', authenticate, async (req: any, res) => {
  try {
    const { mode } = req.query;
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!message) return res.status(404).json({ error: 'Message introuvable.' });

    if (mode === 'all') {
      if (message.senderId !== req.userId) {
        return res.status(403).json({ error: 'Vous ne pouvez supprimer pour tous que vos propres messages.' });
      }
      await prisma.message.update({
        where: { id: req.params.id },
        data: { deletedForAll: true, content: null, imageUrl: null },
      });
      io.to(`conversation:${message.conversationId}`).emit('message_deleted', { messageId: req.params.id });
    } else {
      await prisma.message.update({
        where: { id: req.params.id },
        data: { deletedFor: { push: req.userId } },
      });
    }
    res.json({ message: 'Message supprimé.' });
  } catch (e) {
    console.error('Erreur suppression message:', e);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Supprimer une conversation
router.delete('/conversations/:id', authenticate, async (req: any, res) => {
  try {
    const membership = await prisma.conversation.findFirst({
      where: { id: req.params.id, participants: { some: { id: req.userId } } },
      select: { id: true },
    });
    if (!membership) return res.status(403).json({ error: 'Accès refusé.' });

    await prisma.message.deleteMany({ where: { conversationId: req.params.id } });
    await prisma.conversation.delete({ where: { id: req.params.id } });
    res.json({ message: 'Conversation supprimée.' });
  } catch {
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Bloquer un utilisateur
router.post('/block', authenticate, async (req: any, res) => {
  try {
    const { blockedId } = req.body;
    await prisma.block.create({ data: { blockedById: req.userId, blockedId } });
    res.json({ message: 'Utilisateur bloqué.' });
  } catch (e: any) {
    if (e.code === 'P2002') return res.json({ message: 'Déjà bloqué.' });
    res.status(500).json({ error: 'Erreur.' });
  }
});

export default router;