import { prisma } from '../config/database';
import {
  VOICE_CALL_DAILY_MINUTES,
  voiceCallDailyLimitSeconds,
  type VoiceCallTier,
} from '../config/voiceCall';

// Identifie l'appelant pour le quota : un utilisateur connecté est suivi par
// userId, un visiteur anonyme par un identifiant d'appareil (cookie) — jamais
// par IP seule, ni les deux à la fois. Voir voice.routes.ts pour la génération
// du visitorId.
export interface QuotaIdentity {
  userId?: string;
  visitorId?: string;
}

export interface QuotaState {
  tier: VoiceCallTier;
  limitSeconds: number;
  usedSeconds: number;
  remainingSeconds: number;
  resetAt: Date; // minuit UTC suivant
}

// 'YYYY-MM-DD' en UTC — la Guinée est en UTC+0 donc ça correspond à la date
// locale de Conakry, et la réinitialisation a bien lieu à minuit à Conakry.
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextMidnightUTC(): Date {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next;
}

// Détermine le palier de quota d'un appelant. `null` = visiteur non connecté.
export async function resolveTier(userId?: string): Promise<VoiceCallTier> {
  if (!userId) return 'ANONYMOUS';
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasPriorityValidation: true },
  });
  if (!user) return 'ANONYMOUS';
  return user.hasPriorityValidation ? 'MANSA' : 'FREE_USER';
}

async function getOrResetQuota(identity: QuotaIdentity) {
  const where = identity.userId ? { userId: identity.userId } : { visitorId: identity.visitorId };
  const today = todayUTC();

  const existing = await prisma.voiceQuota.findFirst({ where });

  if (!existing) {
    return prisma.voiceQuota.create({
      data: {
        userId: identity.userId,
        visitorId: identity.userId ? undefined : identity.visitorId,
        secondsUsed: 0,
        usageDate: today,
      },
    });
  }

  if (existing.usageDate !== today) {
    return prisma.voiceQuota.update({
      where: { id: existing.id },
      data: { secondsUsed: 0, usageDate: today },
    });
  }

  return existing;
}

// Renvoie l'état actuel du quota (sans le consommer).
export async function getQuotaState(identity: QuotaIdentity): Promise<QuotaState> {
  const tier = await resolveTier(identity.userId);
  const limitSeconds = voiceCallDailyLimitSeconds(tier);
  const quota = await getOrResetQuota(identity);
  const usedSeconds = Math.min(quota.secondsUsed, limitSeconds);
  return {
    tier,
    limitSeconds,
    usedSeconds,
    remainingSeconds: Math.max(0, limitSeconds - usedSeconds),
    resetAt: nextMidnightUTC(),
  };
}

// Consomme `seconds` du quota (appelé à chaque heartbeat). Le décompte est
// toujours plafonné à la limite du jour — impossible de descendre en dessous
// de 0 restant, quel que soit l'écart envoyé.
export async function consumeQuotaSeconds(identity: QuotaIdentity, seconds: number): Promise<QuotaState> {
  const tier = await resolveTier(identity.userId);
  const limitSeconds = voiceCallDailyLimitSeconds(tier);
  const quota = await getOrResetQuota(identity);

  const newUsed = Math.min(limitSeconds, Math.max(0, quota.secondsUsed) + Math.max(0, seconds));
  await prisma.voiceQuota.update({
    where: { id: quota.id },
    data: { secondsUsed: newUsed },
  });

  return {
    tier,
    limitSeconds,
    usedSeconds: newUsed,
    remainingSeconds: Math.max(0, limitSeconds - newUsed),
    resetAt: nextMidnightUTC(),
  };
}

export { VOICE_CALL_DAILY_MINUTES };
