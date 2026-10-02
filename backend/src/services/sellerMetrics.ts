import { prisma } from '../config/database';

// Mesures de réactivité d'un vendeur sur ses 50 conversations les plus récentes —
// partagées entre le profil public / la page Boutiques (badge "Vendeur réactif")
// et le score vendeur (services/ranking/jobs.ts).
export interface MessagingMetrics {
  // Temps de réponse moyen en minutes — null si < 5 réponses (échantillon trop petit).
  avgResponseMinutes: number | null;
  // Part des conversations des 30 derniers jours restées sans réponse du vendeur
  // depuis plus de 48 h — null si < 3 conversations concernées.
  unansweredRatio: number | null;
}

const UNANSWERED_AFTER_MS = 48 * 60 * 60 * 1000;

export async function computeMessagingMetrics(userId: string): Promise<MessagingMetrics> {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { id: userId } } },
    include: { messages: { orderBy: { createdAt: 'asc' }, select: { senderId: true, createdAt: true } } },
    take: 50,
    orderBy: { lastMessageAt: 'desc' },
  });
  const now = Date.now();
  const diffsMs: number[] = [];
  let recentConvs = 0;
  let unanswered = 0;
  for (const conv of conversations) {
    const msgs = conv.messages;
    for (let i = 1; i < msgs.length; i++) {
      if (msgs[i].senderId === userId && msgs[i - 1].senderId !== userId) {
        diffsMs.push(msgs[i].createdAt.getTime() - msgs[i - 1].createdAt.getTime());
      }
    }
    const last = msgs[msgs.length - 1];
    // Conversations où l'AUTRE personne a écrit en dernier (le vendeur doit répondre)
    if (last && now - last.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000 && msgs.some(m => m.senderId !== userId)) {
      if (last.senderId !== userId) {
        if (now - last.createdAt.getTime() > UNANSWERED_AFTER_MS) { recentConvs++; unanswered++; }
      } else {
        recentConvs++;
      }
    }
  }
  return {
    avgResponseMinutes: diffsMs.length >= 5 ? diffsMs.reduce((a, b) => a + b, 0) / diffsMs.length / 60000 : null,
    unansweredRatio: recentConvs >= 3 ? unanswered / recentConvs : null,
  };
}

export async function computeAvgResponseTimeMinutes(userId: string): Promise<number | null> {
  return (await computeMessagingMetrics(userId)).avgResponseMinutes;
}

// Badge "Vendeur réactif" dérivé du temps de réponse moyen
export function computeResponsiveBadge(avgResponseMinutes: number | null): { label: string; color: string; emoji: string } | null {
  if (avgResponseMinutes == null) return null;
  if (avgResponseMinutes <= 15) {
    return { label: 'Très réactif', color: 'text-guinea-700 bg-guinea-50 border-guinea-200', emoji: '⚡' };
  }
  if (avgResponseMinutes <= 60) {
    return { label: 'Vendeur réactif', color: 'text-primary-700 bg-primary-50 border-primary-200', emoji: '💬' };
  }
  return null;
}
