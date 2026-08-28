import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { chatWithAssistant, ChatTurn, ChatPersonalization, classifyGeminiError } from '../services/gemini.service';
import { prisma } from '../config/database';

const router = Router();

// Message montré à l'utilisateur selon la cause réelle de l'échec — la vraie
// erreur (statut HTTP + détail Gemini) est TOUJOURS logguée côté serveur via
// classifyGeminiError(), quel que soit le message renvoyé au client.
const USER_MESSAGES: Record<string, string> = {
  QUOTA_EXCEEDED: 'Je suis très sollicité en ce moment 😅 Réessaie dans quelques minutes, ou écris-nous directement sur WhatsApp : +224 627 54 34 86.',
  RATE_LIMITED: 'Tu m\'as posé pas mal de questions d\'un coup 🙂 Patiente une minute avant de continuer, ou écris-nous sur WhatsApp : +224 627 54 34 86.',
  SERVICE_UNAVAILABLE: 'Le service IA est temporairement surchargé côté Google 🙏 Réessaie dans quelques instants, ou écris-nous sur WhatsApp : +224 627 54 34 86.',
};
const DEFAULT_USER_MESSAGE = 'Assistant indisponible pour le moment. Contacte le support WhatsApp : +224 627 54 34 86.';

// Anti-abus + protection du quota Gemini (le plan gratuit a un quota quotidien fixe
// partagé par tout le site) : un client qui spamme le chat peut épuiser le quota pour
// tout le monde. Limite volontairement large pour ne pas gêner un usage normal.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: { error: USER_MESSAGES.RATE_LIMITED, code: 'AI_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/chat', chatLimiter, async (req: any, res) => {
  try {
    const { message, history } = req.body;
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message vide.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message trop long (1000 caractères maximum).' });
    }

    const safeHistory: ChatTurn[] = Array.isArray(history)
      ? history
          .filter((h: any) => (h?.role === 'user' || h?.role === 'model') && typeof h?.text === 'string')
          .slice(-10)
          .map((h: any) => ({ role: h.role, text: h.text.slice(0, 1000) }))
      : [];

    // Personnalisation par compte : uniquement pour un utilisateur connecté
    // (req.userId posé par optionalAuthenticate en amont, voir index.ts) — un visiteur
    // anonyme garde le comportement par défaut d'Ibkek. Isolée dans son propre
    // try/catch : un pépin ici (base de données, etc.) ne doit JAMAIS faire échouer
    // toute la réponse du chat — Ibkek répond simplement sans personnalisation.
    let personalization: ChatPersonalization | undefined;
    if (req.userId) {
      try {
        const [prefs, user] = await Promise.all([
          prisma.chatbotPreference.findUnique({ where: { userId: req.userId } }),
          prisma.user.findUnique({ where: { id: req.userId }, select: { firstName: true } }),
        ]);
        if (prefs) {
          personalization = {
            botName: prefs.botName,
            tone: prefs.tone as 'FORMAL' | 'CASUAL',
            personality: prefs.personality as 'PRO' | 'FUNNY' | 'DIRECT',
            botLanguage: prefs.botLanguage as 'FR' | 'EN',
            firstName: prefs.useFirstName ? user?.firstName : undefined,
          };
        }
      } catch (prefsError) {
        console.error('[ai.routes] Impossible de charger les préférences du chatbot (réponse envoyée sans personnalisation) :', prefsError);
      }
    }

    const reply = await chatWithAssistant(message.trim(), safeHistory, personalization);
    res.json({ reply });
  } catch (e: any) {
    const { code, status, detail } = classifyGeminiError(e);
    // Log clair et complet : code déduit, statut HTTP réel renvoyé par Gemini,
    // et détail brut (contient le message JSON complet de l'API en cas d'ApiError).
    console.error(`[ai.routes] Erreur chatbot Gemini — code=${code} status=${status ?? 'n/a'} :`, detail);
    if (code === 'QUOTA_EXCEEDED') {
      console.error('[ai.routes] ACTION REQUISE : quota Gemini dépassé — vérifier/recharger le compte sur https://aistudio.google.com/ (ou la console Google Cloud si facturation activée).');
    } else if (code === 'AUTH_ERROR') {
      console.error('[ai.routes] ACTION REQUISE : clé GEMINI_API_KEY invalide, expirée ou révoquée — vérifier la variable d\'environnement côté serveur (Railway).');
    } else if (code === 'NOT_CONFIGURED') {
      console.error('[ai.routes] ACTION REQUISE : GEMINI_API_KEY absente côté serveur — l\'assistant ne peut pas fonctionner tant qu\'elle n\'est pas définie.');
    } else if (code === 'SERVICE_UNAVAILABLE') {
      console.error('[ai.routes] Surcharge temporaire du modèle Gemini côté Google (503 UNAVAILABLE) — 2 nouvelles tentatives automatiques ont déjà échoué, aucune action requise si ça reste ponctuel.');
    }

    res.status(503).json({
      error: USER_MESSAGES[code] || DEFAULT_USER_MESSAGE,
      code: `AI_${code}`,
    });
  }
});

export default router;
