// src/services/whatsapp.service.ts
// Vérification de numéro de téléphone par code envoyé sur WhatsApp, via Twilio Verify.
// Twilio Verify gère lui-même la génération du code, son expiration (10 min par
// défaut, configurable dans le dashboard Twilio du Verify Service) et le nombre
// de tentatives — on ne stocke aucun code ni état de vérification côté TrouveTout224,
// on se contente d'appeler leur API et de persister le résultat final (phoneVerified).
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

if (!client || !verifyServiceSid) {
  console.error('[whatsapp.service] TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_VERIFY_SERVICE_SID manquant(s) — vérification téléphone par WhatsApp désactivée (le site continue de fonctionner normalement).');
}

// Envoie le code de vérification sur WhatsApp au numéro donné (format E.164, ex:
// +224620000000). Lève une exception en cas d'échec — voir classifyTwilioError()
// pour transformer l'erreur en message utilisateur clair.
export async function startPhoneVerification(phoneE164: string): Promise<void> {
  if (!client || !verifyServiceSid) throw new Error('WHATSAPP_NOT_CONFIGURED');
  await client.verify.v2.services(verifyServiceSid).verifications.create({
    to: phoneE164,
    channel: 'whatsapp',
  });
}

// Vérifie le code saisi par l'utilisateur. Retourne true si approuvé, false si le
// code est incorrect ou expiré (Twilio renvoie un statut, pas une exception, dans
// ce cas précis). Lève une exception pour les autres erreurs (config, réseau...).
export async function checkPhoneVerification(phoneE164: string, code: string): Promise<boolean> {
  if (!client || !verifyServiceSid) throw new Error('WHATSAPP_NOT_CONFIGURED');
  const check = await client.verify.v2.services(verifyServiceSid).verificationChecks.create({
    to: phoneE164,
    code,
  });
  return check.status === 'approved';
}

export type WhatsAppErrorCode =
  | 'NOT_CONFIGURED'      // variables Twilio absentes côté serveur
  | 'AUTH_ERROR'          // Account SID / Auth Token invalides
  | 'INVALID_PHONE'       // numéro refusé par Twilio (format E.164 invalide, etc.)
  | 'WHATSAPP_NOT_ENABLED' // Verify Service pas configuré pour le canal WhatsApp
  | 'RATE_LIMITED'        // trop d'envois vers ce numéro sur la fenêtre Twilio
  | 'MAX_ATTEMPTS'        // trop de codes faux saisis (Twilio bloque ce numéro temporairement)
  | 'UNKNOWN';

export interface WhatsAppErrorInfo {
  code: WhatsAppErrorCode;
  twilioCode?: number;
  detail: string;
}

// Transforme une erreur Twilio brute en code exploitable par la route, pour choisir
// le bon message utilisateur ET logger clairement la vraie cause. Référence des
// codes Twilio : https://www.twilio.com/docs/api/errors
export function classifyTwilioError(e: any): WhatsAppErrorInfo {
  const message: string = e?.message || String(e);
  const twilioCode: number | undefined = typeof e?.code === 'number' ? e.code : undefined;

  if (message === 'WHATSAPP_NOT_CONFIGURED') return { code: 'NOT_CONFIGURED', detail: message };
  if (twilioCode === 20003 || twilioCode === 20404 || e?.status === 401) {
    return { code: 'AUTH_ERROR', twilioCode, detail: message };
  }
  if (twilioCode === 60200) return { code: 'INVALID_PHONE', twilioCode, detail: message };
  if (twilioCode === 60223 || /whatsapp/i.test(message) && /not (enabled|configured|supported|approved)/i.test(message)) {
    return { code: 'WHATSAPP_NOT_ENABLED', twilioCode, detail: message };
  }
  if (twilioCode === 60203 || twilioCode === 60212) return { code: 'RATE_LIMITED', twilioCode, detail: message };
  if (twilioCode === 60202) return { code: 'MAX_ATTEMPTS', twilioCode, detail: message };
  return { code: 'UNKNOWN', twilioCode, detail: message };
}
