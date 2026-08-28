import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const ENUMS = {
  avatarType: ['EMOJI', 'ICON', 'CUSTOM'],
  tone: ['FORMAL', 'CASUAL'],
  personality: ['PRO', 'FUNNY', 'DIRECT'],
  botLanguage: ['FR', 'EN'],
  windowTheme: ['LIGHT', 'DARK', 'SYSTEM'],
  windowSize: ['COMPACT', 'LARGE'],
  fontSize: ['SMALL', 'MEDIUM', 'LARGE'],
  fontFamily: ['SYSTEM', 'SERIF', 'MONO', 'ROUNDED'],
  bubblePosition: ['BOTTOM_RIGHT', 'BOTTOM_LEFT'],
} as const;

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const MAX_QUICK_REPLIES = 8;

// Lecture (avec upsert des valeurs par défaut) : renvoie toujours une ligne exploitable,
// même si l'utilisateur n'a jamais rien personnalisé — le front n'a jamais besoin de
// gérer un cas "pas encore de préférences".
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const prefs = await prisma.chatbotPreference.upsert({
      where: { userId: req.userId },
      update: {},
      create: { userId: req.userId },
    });
    res.json({ data: prefs });
  } catch (error) {
    console.error('Erreur GET /chatbot-prefs/me:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des préférences.' });
  }
});

function validateQuickReplies(value: any): { ok: true; value: any[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: false, error: 'quickReplies doit être une liste.' };
  if (value.length > MAX_QUICK_REPLIES) return { ok: false, error: `Maximum ${MAX_QUICK_REPLIES} raccourcis rapides.` };
  const cleaned = [];
  for (const item of value) {
    if (typeof item?.label !== 'string' || !item.label.trim() || item.label.length > 40) {
      return { ok: false, error: 'Chaque raccourci doit avoir un libellé (40 caractères max).' };
    }
    if (typeof item?.message !== 'string' || !item.message.trim() || item.message.length > 300) {
      return { ok: false, error: 'Chaque raccourci doit avoir un message (300 caractères max).' };
    }
    cleaned.push({
      id: typeof item.id === 'string' ? item.id : `qr_${Math.random().toString(36).slice(2, 10)}`,
      label: item.label.trim(),
      message: item.message.trim(),
      pinned: !!item.pinned,
    });
  }
  return { ok: true, value: cleaned };
}

// Mise à jour partielle : seuls les champs présents dans le body sont modifiés — le
// panneau de personnalisation peut sauvegarder un seul réglage à la fois sans jamais
// écraser les autres.
router.put('/me', authenticate, async (req: any, res) => {
  try {
    const body = req.body || {};
    const data: Record<string, any> = {};

    // Chaînes libres (bornées en longueur, jamais de contenu exécutable côté client :
    // c'est du texte affiché tel quel, pas du HTML interprété).
    if (body.botName !== undefined) {
      const v = String(body.botName || '').trim();
      if (!v || v.length > 30) return res.status(400).json({ error: 'Nom du bot invalide (1 à 30 caractères).' });
      data.botName = v;
    }
    if (body.welcomeMessage !== undefined) {
      const v = body.welcomeMessage === null ? null : String(body.welcomeMessage).trim().slice(0, 300) || null;
      data.welcomeMessage = v;
    }
    if (body.signatureEmoji !== undefined) {
      const v = body.signatureEmoji === null ? null : String(body.signatureEmoji).trim().slice(0, 8) || null;
      data.signatureEmoji = v;
    }
    if (body.messageSignature !== undefined) {
      const v = body.messageSignature === null ? null : String(body.messageSignature).trim().slice(0, 60) || null;
      data.messageSignature = v;
    }
    if (body.avatarValue !== undefined) {
      const v = String(body.avatarValue || '').trim().slice(0, 500);
      if (!v) return res.status(400).json({ error: 'Avatar invalide.' });
      data.avatarValue = v;
    }
    if (body.launcherIcon !== undefined) {
      data.launcherIcon = String(body.launcherIcon || 'message-circle').trim().slice(0, 40);
    }
    if (body.chatBackground !== undefined) {
      data.chatBackground = String(body.chatBackground || 'NONE').trim().slice(0, 40);
    }

    // Couleurs hexadécimales
    for (const field of ['bubbleColor', 'nameColor', 'badgeColor'] as const) {
      if (body[field] !== undefined) {
        if (!HEX_COLOR_REGEX.test(body[field])) {
          return res.status(400).json({ error: `Couleur invalide pour ${field} (format hexadécimal attendu, ex: #16a34a).` });
        }
        data[field] = body[field];
      }
    }

    // Enums
    for (const [field, allowed] of Object.entries(ENUMS)) {
      if (body[field] !== undefined) {
        if (!(allowed as readonly string[]).includes(body[field])) {
          return res.status(400).json({ error: `Valeur invalide pour ${field}.` });
        }
        data[field] = body[field];
      }
    }

    // Booléens
    for (const field of [
      'soundEnabled', 'sendSoundEnabled', 'vibrationEnabled', 'silentMode',
      'historyVisibleByDefault', 'useFirstName',
    ] as const) {
      if (body[field] !== undefined) data[field] = !!body[field];
    }

    // Raccourcis rapides (JSON)
    if (body.quickReplies !== undefined) {
      const result = validateQuickReplies(body.quickReplies);
      if (!result.ok) return res.status(400).json({ error: result.error });
      data.quickReplies = result.value;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });
    }

    const prefs = await prisma.chatbotPreference.upsert({
      where: { userId: req.userId },
      update: data,
      create: { userId: req.userId, ...data },
    });

    res.json({ message: 'Préférences mises à jour.', data: prefs });
  } catch (error) {
    console.error('Erreur PUT /chatbot-prefs/me:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des préférences.' });
  }
});

// Réinitialise toutes les préférences aux valeurs par défaut (supprime simplement la
// ligne — le prochain GET la recrée avec les defaults du schéma).
router.delete('/me', authenticate, async (req: any, res) => {
  try {
    await prisma.chatbotPreference.deleteMany({ where: { userId: req.userId } });
    res.json({ message: 'Préférences réinitialisées.' });
  } catch (error) {
    console.error('Erreur DELETE /chatbot-prefs/me:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation.' });
  }
});

export default router;
