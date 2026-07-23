// Petits utilitaires autour de la Web Speech API du navigateur (gratuite,
// intégrée — aucun service payant type ElevenLabs/Twilio/OpenAI Realtime).
// Support variable selon les navigateurs : Chrome/Edge desktop et Android OK,
// Safari desktop partiel, Safari iOS ne supporte PAS SpeechRecognition —
// isVoiceCallSupported() sert à basculer proprement vers le chat texte.

export function getSpeechRecognitionCtor(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isVoiceCallSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getSpeechRecognitionCtor() && 'speechSynthesis' in window;
}

export type MicErrorKind = 'denied' | 'no-device' | 'device-busy' | 'insecure-context' | 'unsupported' | 'unknown';

// Instantané de l'état du micro au moment d'une tentative — sert uniquement
// au panneau diagnostic temporaire affiché à l'écran en cas d'échec, pour
// permettre de signaler précisément ce qui bloque sans avoir à ouvrir la
// console du navigateur.
export interface MicDiagnostics {
  permissionState: string;
  errorName: string | null;
  errorMessage: string | null;
  isSecureContext: boolean;
  protocol: string;
  audioInputCount: number;
  userAgent: string;
}

export async function collectMicDiagnostics(err?: any): Promise<MicDiagnostics> {
  let permissionState = 'unsupported';
  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      permissionState = status.state;
    }
  } catch {}
  let audioInputCount = 0;
  try {
    const devices = await navigator.mediaDevices?.enumerateDevices?.();
    audioInputCount = devices?.filter(d => d.kind === 'audioinput').length ?? 0;
  } catch {}
  return {
    permissionState,
    errorName: err?.name || null,
    errorMessage: err?.message || null,
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
    protocol: typeof window !== 'undefined' ? window.location.protocol : '',
    audioInputCount,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

export type MicAccessResult =
  | { ok: true; diagnostics: MicDiagnostics }
  | { ok: false; kind: MicErrorKind; diagnostics: MicDiagnostics };

// Demande le micro via getUserMedia AVANT de démarrer SpeechRecognition.
// Nécessaire car Chrome mémorise en interne, pour toute la durée de l'onglet,
// le premier verdict qu'il a donné à SpeechRecognition — si ce verdict était
// "refusé", recognition.start() continue de renvoyer 'not-allowed' même après
// que l'utilisateur a autorisé le micro dans les réglages du site, tant que la
// page n'est pas rechargée. getUserMedia, lui, relit toujours l'état réel et
// courant de la permission, ce qui contourne ce cache. On coupe le flux
// immédiatement après : seul SpeechRecognition doit garder la main sur le micro.
//
// IMPORTANT : cette fonction doit être appelée SANS await avant elle depuis le
// gestionnaire de clic (pas dans un useEffect ni après un setTimeout) — les
// navigateurs exigent un geste utilisateur direct pour autoriser la demande
// de permission micro.
export async function requestMicAccess(): Promise<MicAccessResult> {
  if (typeof window === 'undefined') {
    return { ok: false, kind: 'unknown', diagnostics: await collectMicDiagnostics() };
  }
  if (!window.isSecureContext) {
    return { ok: false, kind: 'insecure-context', diagnostics: await collectMicDiagnostics() };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, kind: 'unsupported', diagnostics: await collectMicDiagnostics() };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return { ok: true, diagnostics: await collectMicDiagnostics() };
  } catch (err: any) {
    const diagnostics = await collectMicDiagnostics(err);
    switch (err?.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return { ok: false, kind: 'denied', diagnostics };
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return { ok: false, kind: 'no-device', diagnostics };
      case 'NotReadableError':
      case 'TrackStartError':
        return { ok: false, kind: 'device-busy', diagnostics };
      default:
        return { ok: false, kind: 'unknown', diagnostics };
    }
  }
}

const RECOGNITION_LANG: Record<string, string> = { fr: 'fr-FR', en: 'en-US', zh: 'zh-CN' };

export function speechLangFor(locale: string): string {
  return RECOGNITION_LANG[locale] || 'fr-FR';
}

// ── Réglages de naturel de la voix ──────────────────────────────────────
// Modifie ces valeurs pour changer le rendu par défaut de la synthèse vocale
// (l'utilisateur peut aussi régler la vitesse lui-même dans
// Paramètres > Apparence > Voix de l'assistant, ce qui prime sur cette valeur).
export const VOICE_DEFAULT_RATE = 0.95;    // 1.0 = vitesse normale du navigateur. Plus lent = plus naturel, moins robotique.
export const VOICE_DEFAULT_PITCH = 1.0;    // 1.0 = hauteur de voix normale — évite le ton artificiellement aigu.
export const VOICE_DEFAULT_VOLUME = 1.0;   // Volume maximum.
export const VOICE_SENTENCE_GAP_MS = 150;  // Micro-pause entre deux phrases pour un débit plus humain.
// Chrome met en pause la synthèse vocale toute seule au bout d'environ 15s de
// lecture continue (bug connu) — on rappelle resume() à intervalle régulier
// pour contourner ça, sans effet sur les navigateurs non concernés.
const VOICE_RESUME_WORKAROUND_MS = 5000;

// Les voix ne sont pas toujours disponibles immédiatement (chargement async
// par le navigateur) — cette fonction attend l'évènement 'voiceschanged' si
// la liste est vide au premier appel.
export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return resolve([]);
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) return resolve(existing);
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Filet de sécurité si l'évènement ne se déclenche jamais (certains navigateurs)
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

// Voix connues pour sonner nettement moins robotique que la synthèse "compact"
// par défaut. Ordre de priorité demandé : Neural/Natural (Edge/Windows) >
// Google > voix locales de qualité connues (Apple) > n'importe quelle voix
// de la langue en dernier recours.
const NEURAL_HINTS = ['neural', 'natural'];
const GOOGLE_HINT = 'google';
const QUALITY_LOCAL_NAMES = ['amélie', 'amelie', 'thomas', 'aurélie', 'aurelie', 'audrey'];

function voiceQualityScore(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  if (NEURAL_HINTS.some(h => name.includes(h))) return 4;
  if (name.includes(GOOGLE_HINT)) return 3;
  if (QUALITY_LOCAL_NAMES.some(n => name.includes(n))) return 2;
  return 1;
}

// Liste les voix disponibles sur l'appareil pour une langue donnée (ex: 'fr-FR'),
// triées de la meilleure à la moins bonne — sert au sélecteur de voix des
// Paramètres pour proposer un "Écouter un exemple" par voix.
export async function listVoicesFor(lang: string): Promise<SpeechSynthesisVoice[]> {
  const voices = await getVoices();
  const short = lang.slice(0, 2).toLowerCase();
  const matching = voices.filter(v => v.lang.toLowerCase().startsWith(short));
  return [...matching].sort((a, b) => voiceQualityScore(b) - voiceQualityScore(a));
}

// Choisit la meilleure voix disponible pour une langue. Si preferredVoiceURI
// est fourni (choix sauvegardé par l'utilisateur dans les Paramètres) et
// qu'elle existe toujours sur l'appareil, elle est utilisée en priorité —
// sinon on retombe sur la meilleure voix disponible selon le score qualité.
export async function pickBestVoice(lang: string, preferredVoiceURI?: string | null): Promise<SpeechSynthesisVoice | undefined> {
  const pool = await listVoicesFor(lang);
  if (pool.length === 0) return undefined;
  if (preferredVoiceURI) {
    const chosen = pool.find(v => v.voiceURI === preferredVoiceURI);
    if (chosen) return chosen;
  }
  return pool[0];
}

// ── Nettoyage du texte avant lecture ─────────────────────────────────────
// Une bonne voix lit mal un texte écrit pour les yeux : on retire tout ce qui
// casse la prosodie ou que la synthèse prononcerait littéralement (emojis,
// markdown, URLs) et on développe les abréviations courantes du site.
const EMOJI_REGEX = /[\u{1F1E6}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

const ABBREVIATIONS: [RegExp, string][] = [
  [/\bGNF\b/gi, 'francs guinéens'],
  [/\bFAQ\b/gi, 'questions fréquentes'],
];

export function cleanTextForSpeech(text: string): string {
  let out = text;

  // Emojis (avant tout le reste, sinon certains modificateurs restent isolés)
  out = out.replace(EMOJI_REGEX, '');

  // Liens markdown [texte](url) → garde juste le texte du lien
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  // URLs brutes restantes → remplacées par une formule parlée
  out = out.replace(/https?:\/\/\S+/gi, 'le lien sur le site');
  out = out.replace(/www\.\S+/gi, 'le lien sur le site');

  // Markdown : gras, italique, code inline, titres, listes
  out = out.replace(/\*\*(.*?)\*\*/g, '$1');
  out = out.replace(/__(.*?)__/g, '$1');
  out = out.replace(/`([^`]*)`/g, '$1');
  out = out.replace(/\*(.*?)\*/g, '$1');
  out = out.replace(/_(.*?)_/g, '$1');
  out = out.replace(/^\s{0,3}#{1,6}\s*/gm, '');
  out = out.replace(/^\s{0,3}[-*•]\s+/gm, '');
  out = out.replace(/^\s{0,3}\d+[.)]\s+/gm, '');

  // Abréviations courantes → forme parlée
  for (const [re, replacement] of ABBREVIATIONS) out = out.replace(re, replacement);

  // Tirets et symboles qui cassent la prosodie → pause légère
  out = out.replace(/[–—]/g, ', ');

  // Normalisation des espaces et de la ponctuation (évite les pauses parasites
  // laissées par les remplacements ci-dessus, ex: "site , merci" → "site, merci")
  out = out.replace(/[ \t]{2,}/g, ' ').replace(/\n{2,}/g, '. ').replace(/\n/g, ' ').trim();
  out = out.replace(/\s+([,.!?;:])/g, '$1').replace(/,\s*,/g, ',');

  return out;
}

// Découpe un texte en phrases sur . ! ? … — permet de les enchaîner dans une
// file d'attente au lieu d'envoyer un seul gros bloc à SpeechSynthesis (qui a
// tendance à couper ou décrocher sur les textes longs).
export function splitIntoSentences(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  const matches = cleaned.match(/[^.!?…]+[.!?…]+(?=\s|$)|[^.!?…]+$/g);
  if (!matches) return [cleaned];
  return matches.map(s => s.trim()).filter(Boolean);
}

export interface SpeakVoiceOptions {
  lang: string;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SpeakQueueHandle {
  cancel: () => void;
}

// Lit une liste de phrases l'une après l'autre avec une micro-pause entre
// chacune, plutôt qu'un seul bloc de texte — évite les coupures de
// SpeechSynthesis sur les réponses longues et rend le débit plus humain.
// cancel() arrête tout proprement (la phrase en cours ET la suite de la
// file), pour ne jamais laisser la file continuer après une interruption.
export function speakSentenceQueue(
  sentences: string[],
  opts: SpeakVoiceOptions,
  onEnd: () => void,
  onError?: () => void
): SpeakQueueHandle {
  if (typeof window === 'undefined' || !window.speechSynthesis || sentences.length === 0) {
    onEnd();
    return { cancel: () => {} };
  }

  window.speechSynthesis.cancel();
  let index = 0;
  let cancelled = false;
  let gapTimer: ReturnType<typeof setTimeout> | null = null;

  // Contournement du bug Chrome qui met la synthèse en pause après ~15s.
  const resumeTimer = setInterval(() => {
    if (!cancelled) window.speechSynthesis.resume();
  }, VOICE_RESUME_WORKAROUND_MS);

  const finish = () => {
    cancelled = true;
    clearInterval(resumeTimer);
    if (gapTimer) clearTimeout(gapTimer);
  };

  const speakNext = () => {
    if (cancelled) return;
    if (index >= sentences.length) {
      finish();
      onEnd();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    utterance.lang = opts.lang;
    if (opts.voice) utterance.voice = opts.voice;
    utterance.rate = opts.rate;
    utterance.pitch = opts.pitch;
    utterance.volume = opts.volume;
    index += 1;

    utterance.onend = () => {
      if (cancelled) return;
      gapTimer = setTimeout(speakNext, VOICE_SENTENCE_GAP_MS);
    };
    utterance.onerror = () => {
      if (cancelled) return;
      finish();
      onError?.();
    };
    window.speechSynthesis.speak(utterance);
  };

  speakNext();

  return {
    cancel: () => {
      finish();
      window.speechSynthesis.cancel();
    },
  };
}
