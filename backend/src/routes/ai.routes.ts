import { Router } from 'express';
import { chatWithAssistant, ChatTurn } from '../services/gemini.service';

const router = Router();

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
    console.error('[ai.routes] Erreur chatbot Gemini :', e?.message || e);
    res.status(503).json({
      error: 'Assistant indisponible pour le moment. Contacte le support WhatsApp : +224 627 54 34 86.',
      code: 'AI_UNAVAILABLE',
    });
  }
});

export default router;
