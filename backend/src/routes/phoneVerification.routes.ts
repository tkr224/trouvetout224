import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { normalizeGuineaPhone, GUINEA_PHONE_FORMAT_HINT } from '../utils/phone';
import { checkCooldown, cooldownMessage } from '../config/security';
import { sendSecurityAlertEmail } from '../services/email.service';
import { resolveEmailLocale } from '../i18n/emailLocales';
import { startPhoneVerification, checkPhoneVerification, classifyTwilioError } from '../services/whatsapp.service';

const router = Router();

// Message montré à l'utilisateur selon la cause réelle de l'échec — la vraie erreur
// Twilio est TOUJOURS logguée côté serveur, quel que soit le message renvoyé au client.
const START_ERROR_MESSAGES: Record<string, string> = {
  NOT_CONFIGURED: "La vérification par WhatsApp n'est pas disponible pour le moment. Réessaie plus tard.",
  AUTH_ERROR: "La vérification par WhatsApp n'est pas disponible pour le moment. Réessaie plus tard.",
  INVALID_PHONE: `Numéro refusé par WhatsApp. ${GUINEA_PHONE_FORMAT_HINT}`,
  WHATSAPP_NOT_ENABLED: "La vérification par WhatsApp n'est pas disponible pour le moment. Réessaie plus tard.",
  RATE_LIMITED: 'Trop de codes envoyés à ce numéro récemment. Réessaie dans quelques minutes.',
  UNKNOWN: "Impossible d'envoyer le code WhatsApp pour le moment. Réessaie dans quelques instants.",
};

const CHECK_ERROR_MESSAGES: Record<string, string> = {
  NOT_CONFIGURED: "La vérification par WhatsApp n'est pas disponible pour le moment. Réessaie plus tard.",
  AUTH_ERROR: "La vérification par WhatsApp n'est pas disponible pour le moment. Réessaie plus tard.",
  MAX_ATTEMPTS: 'Trop de tentatives avec un mauvais code. Redemande un nouveau code puis réessaie.',
  UNKNOWN: 'Impossible de vérifier le code pour le moment. Réessaie dans quelques instants.',
};

// Anti-abus : chaque envoi WhatsApp a un coût réel côté Twilio — limite volontairement
// stricte, en plus du rate-limiting propre à Twilio Verify.
const startLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de demandes de code. Réessaie dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives. Réessaie dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Étape 1 : envoie un code de vérification par WhatsApp au numéro donné. Ne modifie
// PAS encore le numéro en base — seule l'étape /verify (avec le bon code) le fait.
router.put('/me/phone/start-verification', authenticate, startLimiter, async (req: any, res) => {
  try {
    const phone = normalizeGuineaPhone(req.body?.phone);
    if (!phone) {
      return res.status(400).json({ error: `Numéro invalide. ${GUINEA_PHONE_FORMAT_HINT}` });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    if (phone === user.phone && user.phoneVerified) {
      return res.status(400).json({ error: 'Ce numéro est déjà vérifié sur votre compte.' });
    }

    if (user.phone && phone !== user.phone) {
      const cooldown = checkCooldown(user.phoneChangedAt);
      if (cooldown.blocked) {
        return res.status(403).json({
          error: cooldownMessage(cooldown.daysRemaining, cooldown.nextAllowedAt!),
          code: 'COOLDOWN_ACTIVE',
          nextAllowedAt: cooldown.nextAllowedAt,
        });
      }
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== req.userId) {
      return res.status(409).json({ error: 'Ce numéro est déjà utilisé par un autre compte.' });
    }

    await startPhoneVerification(phone);
    res.json({ message: 'Code envoyé par WhatsApp.', data: { phone, expiresInMinutes: 10 } });
  } catch (error: any) {
    const { code, twilioCode, detail } = classifyTwilioError(error);
    console.error(`[phone-verification] Erreur envoi code — code=${code} twilioCode=${twilioCode ?? 'n/a'} :`, detail);
    if (code === 'NOT_CONFIGURED') {
      console.error('[phone-verification] ACTION REQUISE : TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_VERIFY_SERVICE_SID absent(s) côté serveur.');
    } else if (code === 'WHATSAPP_NOT_ENABLED') {
      console.error('[phone-verification] ACTION REQUISE : le canal WhatsApp ne semble pas activé sur ce Verify Service Twilio — vérifier la configuration dans la Twilio Console.');
    } else if (code === 'AUTH_ERROR') {
      console.error('[phone-verification] ACTION REQUISE : identifiants Twilio invalides (Account SID / Auth Token).');
    }
    res.status(503).json({ error: START_ERROR_MESSAGES[code] || START_ERROR_MESSAGES.UNKNOWN, code: `WHATSAPP_${code}` });
  }
});

// Étape 2 : vérifie le code saisi. Si correct, c'est ICI (et seulement ici) que le
// numéro est réellement enregistré en base avec phoneVerified = true.
router.put('/me/phone/verify', authenticate, checkLimiter, async (req: any, res) => {
  try {
    const phone = normalizeGuineaPhone(req.body?.phone);
    const code = String(req.body?.code || '').trim();
    if (!phone) {
      return res.status(400).json({ error: `Numéro invalide. ${GUINEA_PHONE_FORMAT_HINT}` });
    }
    if (!/^\d{4,6}$/.test(code)) {
      return res.status(400).json({ error: 'Code invalide (4 à 6 chiffres attendus).' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    const approved = await checkPhoneVerification(phone, code);
    if (!approved) {
      return res.status(400).json({ error: 'Code incorrect ou expiré. Demande un nouveau code si besoin.', code: 'CODE_INVALID' });
    }

    // Revérifie l'unicité au moment de la validation (le numéro a pu être pris par
    // quelqu'un d'autre entre-temps, même si c'est rare vu la fenêtre de 10 min).
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== req.userId) {
      return res.status(409).json({ error: 'Ce numéro est déjà utilisé par un autre compte.' });
    }

    const hadPhoneBefore = !!user.phone;
    const isNewNumber = phone !== user.phone;
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        phone,
        phoneVerified: true,
        ...(isNewNumber ? { phoneChangedAt: new Date() } : {}),
      },
    });

    if (isNewNumber && hadPhoneBefore && user.email) {
      sendSecurityAlertEmail(user.email, user.firstName, 'phone', resolveEmailLocale(user.preferredLanguage)).catch(e => console.log('Email alerte non envoyé:', e.message));
    }

    res.json({ message: 'Numéro de téléphone vérifié avec succès.', data: { phone, phoneVerified: true } });
  } catch (error: any) {
    const { code, twilioCode, detail } = classifyTwilioError(error);
    console.error(`[phone-verification] Erreur vérification code — code=${code} twilioCode=${twilioCode ?? 'n/a'} :`, detail);
    res.status(503).json({ error: CHECK_ERROR_MESSAGES[code] || CHECK_ERROR_MESSAGES.UNKNOWN, code: `WHATSAPP_${code}` });
  }
});

export default router;
