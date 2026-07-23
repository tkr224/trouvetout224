// Configuration du système d'appel vocal IA (Web Speech API navigateur +
// Gemini côté serveur). Toutes les valeurs ajustables sont ici — rien
// d'autre dans le code ne devrait avoir de nombre "en dur" pour ça.

// Quota de minutes d'appel PAR JOUR, selon le type d'appelant. Se réinitialise
// chaque jour à minuit UTC (= minuit heure de Conakry, la Guinée est en UTC+0).
export const VOICE_CALL_DAILY_MINUTES = {
  // Visiteur non connecté (quota suivi par adresse IP)
  ANONYMOUS: 5,
  // Utilisateur inscrit, compte gratuit
  FREE_USER: 15,
  // Abonné Pack Mansa (User.hasPriorityValidation === true)
  MANSA: 60,
};

// Seuil (en secondes) sous lequel on affiche l'alerte "il te reste 1 minute".
export const VOICE_CALL_LOW_TIME_WARNING_SECONDS = 60;

// Intervalle (en secondes) entre deux "heartbeats" envoyés par le client
// pendant un appel actif — c'est ce qui fait avancer le décompte côté serveur
// de façon fiable (impossible à tricher en rafraîchissant la page, puisque le
// temps déjà consommé reste enregistré en base).
export const VOICE_CALL_HEARTBEAT_INTERVAL_SECONDS = 10;

// Un heartbeat qui arrive avec un écart anormalement grand depuis le précédent
// (onglet mis en veille, ordinateur en veille prolongée...) ne doit pas faire
// exploser le décompte : on plafonne l'écart pris en compte à ce multiple de
// l'intervalle attendu.
export const VOICE_CALL_MAX_HEARTBEAT_GAP_SECONDS = VOICE_CALL_HEARTBEAT_INTERVAL_SECONDS * 3;

// Modèle Gemini utilisé pour l'appel vocal — rapide et économique, comme pour
// le chatbot texte (voir backend/src/services/gemini.service.ts).
export const VOICE_CALL_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

// Nombre de messages passés (côté serveur) réinjectés comme mémoire de
// conversation à chaque appel Gemini pendant l'appel.
export const VOICE_CALL_HISTORY_LENGTH = 16;

// Contact humain proposé quand le quota est épuisé ou que l'IA échoue.
export const VOICE_CALL_WHATSAPP_NUMBER = '224627543486';

export type VoiceCallTier = 'ANONYMOUS' | 'FREE_USER' | 'MANSA';

export function voiceCallDailyLimitSeconds(tier: VoiceCallTier): number {
  return VOICE_CALL_DAILY_MINUTES[tier] * 60;
}
