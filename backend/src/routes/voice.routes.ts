import { Router } from 'express';
import { prisma } from '../config/database';
import { chatWithVoiceAssistant, classifyGeminiError, type ChatTurn, type VoiceCallerContext } from '../services/gemini.service';
import { getQuotaState, consumeQuotaSeconds, type QuotaIdentity } from '../services/voiceQuota.service';
import {
  VOICE_CALL_MAX_HEARTBEAT_GAP_SECONDS,
  VOICE_CALL_HISTORY_LENGTH,
  VOICE_CALL_WHATSAPP_NUMBER,
} from '../config/voiceCall';

const router = Router();

const DEFAULT_USER_MESSAGE = `Désolé, je rencontre un souci technique. Contacte le support WhatsApp au ${VOICE_CALL_WHATSAPP_NUMBER}.`;
const USER_MESSAGES: Record<string, string> = {
  QUOTA_EXCEEDED: 'On dirait que je suis très sollicité en ce moment. Réessaie dans quelques minutes.',
};

function getIdentity(req: any): QuotaIdentity {
  return req.userId ? { userId: req.userId } : { ip: req.ip };
}

function serializeQuota(state: Awaited<ReturnType<typeof getQuotaState>>) {
  return {
    tier: state.tier,
    limitSeconds: state.limitSeconds,
    remainingSeconds: state.remainingSeconds,
    resetAt: state.resetAt.toISOString(),
  };
}

// Construit le contexte "appelant" à partir de champs non sensibles
// uniquement — jamais de mot de passe, token, email/téléphone bruts, ni de
// réponse à une question de sécurité.
async function buildCallerContext(userId?: string): Promise<VoiceCallerContext | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      accountType: true,
      shopActive: true,
      emailVerified: true,
      hasPriorityValidation: true,
      _count: { select: { annonces: true } },
    },
  });
  if (!user) return null;
  return {
    firstName: user.firstName,
    accountType: user.accountType,
    hasShop: user.shopActive,
    hasAnnonces: user._count.annonces > 0,
    emailVerified: user.emailVerified,
    isMansa: user.hasPriorityValidation,
  };
}

// ── Démarrer un appel ────────────────────────────────────────────────────
router.post('/start', async (req: any, res) => {
  try {
    const identity = getIdentity(req);
    const quota = await getQuotaState(identity);

    if (quota.remainingSeconds <= 0) {
      return res.json({ allowed: false, quota: serializeQuota(quota) });
    }

    const session = await prisma.voiceCallSession.create({
      data: { userId: req.userId || undefined, ip: req.userId ? undefined : req.ip },
    });

    res.json({ allowed: true, sessionId: session.id, quota: serializeQuota(quota) });
  } catch (e: any) {
    console.error('[voice.routes] Erreur /start :', e?.message || e);
    res.status(503).json({ allowed: false, error: DEFAULT_USER_MESSAGE });
  }
});

// ── Heartbeat pendant l'appel — fait avancer le décompte côté serveur ───
router.post('/heartbeat', async (req: any, res) => {
  try {
    const { sessionId } = req.body;
    if (typeof sessionId !== 'string') return res.status(400).json({ error: 'sessionId manquant.' });

    const session = await prisma.voiceCallSession.findUnique({ where: { id: sessionId } });
    if (!session || session.endedAt) {
      return res.status(404).json({ error: 'Session introuvable ou déjà terminée.' });
    }

    const identity = getIdentity(req);
    const now = new Date();
    const elapsedSeconds = Math.min(
      VOICE_CALL_MAX_HEARTBEAT_GAP_SECONDS,
      Math.max(0, Math.round((now.getTime() - session.lastHeartbeat.getTime()) / 1000))
    );

    const quota = await consumeQuotaSeconds(identity, elapsedSeconds);
    const exceeded = quota.remainingSeconds <= 0;

    await prisma.voiceCallSession.update({
      where: { id: sessionId },
      data: {
        lastHeartbeat: now,
        secondsUsed: session.secondsUsed + elapsedSeconds,
        ...(exceeded ? { endedAt: now, endReason: 'QUOTA_EXCEEDED' } : {}),
      },
    });

    res.json({ allowed: !exceeded, quota: serializeQuota(quota) });
  } catch (e: any) {
    console.error('[voice.routes] Erreur /heartbeat :', e?.message || e);
    // Panne technique du heartbeat : on laisse l'appel continuer plutôt que de
    // le couper brutalement à cause d'une erreur serveur transitoire.
    res.json({ allowed: true });
  }
});

// ── Un tour de parole : message transcrit → réponse Gemini ─────────────
router.post('/chat', async (req: any, res) => {
  try {
    const { sessionId, message } = req.body;
    if (typeof sessionId !== 'string') return res.status(400).json({ error: 'sessionId manquant.' });
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message vide.' });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: 'Message trop long.' });
    }

    const session = await prisma.voiceCallSession.findUnique({ where: { id: sessionId } });
    if (!session || session.endedAt) {
      return res.status(404).json({ error: 'Session introuvable ou déjà terminée.' });
    }

    // Vérification défensive du quota AVANT d'appeler Gemini (le heartbeat est
    // la source d'autorité du décompte, mais on ne veut pas dépenser un appel
    // Gemini si le quota est déjà à zéro).
    const identity = getIdentity(req);
    const quota = await getQuotaState(identity);
    if (quota.remainingSeconds <= 0) {
      return res.status(403).json({ error: USER_MESSAGES.QUOTA_EXCEEDED, code: 'VOICE_QUOTA_EXCEEDED', quota: serializeQuota(quota) });
    }

    const trimmed = message.trim();

    const previous = await prisma.voiceCallMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: VOICE_CALL_HISTORY_LENGTH,
    });
    const history: ChatTurn[] = previous.map(m => ({ role: m.role === 'USER' ? 'user' : 'model', text: m.text }));

    const caller = await buildCallerContext(session.userId || undefined);
    const reply = await chatWithVoiceAssistant(trimmed, history, caller);

    await prisma.voiceCallMessage.createMany({
      data: [
        { sessionId, role: 'USER', text: trimmed },
        { sessionId, role: 'MODEL', text: reply },
      ],
    });

    res.json({ reply });
  } catch (e: any) {
    const { code, status, detail } = classifyGeminiError(e);
    console.error(`[voice.routes] Erreur chat vocal — code=${code} status=${status ?? 'n/a'} :`, detail);
    res.status(503).json({
      error: USER_MESSAGES[code] || DEFAULT_USER_MESSAGE,
      code: `VOICE_${code}`,
    });
  }
});

// ── Raccrocher ───────────────────────────────────────────────────────────
router.post('/end', async (req: any, res) => {
  try {
    const { sessionId, reason } = req.body;
    if (typeof sessionId !== 'string') return res.status(400).json({ error: 'sessionId manquant.' });

    const session = await prisma.voiceCallSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.json({ ok: true });
    if (session.endedAt) return res.json({ ok: true });

    const identity = getIdentity(req);
    const now = new Date();
    const elapsedSeconds = Math.min(
      VOICE_CALL_MAX_HEARTBEAT_GAP_SECONDS,
      Math.max(0, Math.round((now.getTime() - session.lastHeartbeat.getTime()) / 1000))
    );
    await consumeQuotaSeconds(identity, elapsedSeconds);

    await prisma.voiceCallSession.update({
      where: { id: sessionId },
      data: {
        endedAt: now,
        secondsUsed: session.secondsUsed + elapsedSeconds,
        endReason: reason === 'ERROR' ? 'ERROR' : 'USER_HANGUP',
      },
    });

    res.json({ ok: true });
  } catch (e: any) {
    console.error('[voice.routes] Erreur /end :', e?.message || e);
    res.json({ ok: true });
  }
});

export default router;
