import { Router } from 'express';
import { chatWithAssistant, ChatTurn, classifyGeminiError } from '../services/gemini.service';

const router = Router();

// Message montré à l'utilisateur selon la cause réelle de l'échec — la vraie
// erreur (statut HTTP + détail Gemini) est TOUJOURS logguée côté serveur via
// classifyGeminiError(), quel que soit le message renvoyé au client.
const USER_MESSAGES: Record<string, string> = {
  QUOTA_EXCEEDED: 'Je suis très sollicité en ce moment 😅 Réessaie dans quelques minutes, ou écris-nous directement sur WhatsApp : +224 627 54 34 86.',
};
const DEFAULT_USER_MESSAGE = 'Assistant indisponible pour le moment. Contacte le support WhatsApp : +224 627 54 34 86.';

router.post('/chat', async (req: any, res) => {
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

    const reply = await chatWithAssistant(message.trim(), safeHistory);
    res.json({ reply });
  } catch (e: any) {
    const { code, status, detail } = classifyGeminiError(e);
    // Log clair et complet : code déduit, statut HTTP réel renvoyé par Gemini,
    // et détail brut (contient le message JSON complet de l'API en cas d'ApiError).
    console.error(`[ai.routes] Erreur chatbot Gemini — code=${code} status=${status ?? 'n/a'} :`, detail);

    res.status(503).json({
      error: USER_MESSAGES[code] || DEFAULT_USER_MESSAGE,
      code: `AI_${code}`,
    });
  }
});

export default router;
