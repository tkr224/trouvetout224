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
export const VOICE_DEFAULT_RATE = 1.05;    // 1.0 = vitesse normale. Légèrement > 1 = débit plus enjoué/dynamique, sans forcer.
export const VOICE_DEFAULT_PITCH = 1.05;   // 1.0 = hauteur normale. Légèrement > 1 = sonne un peu plus jeune, sans devenir aigu/artificiel.
export const VOICE_DEFAULT_VOLUME = 1.0;   // Volume maximum.
// Pause entre deux BLOCS de lecture (pas entre chaque phrase — voir
// groupSentencesIntoBlocks ci-dessous). Une conversation naturelle n'a
// quasiment pas de silence entre deux phrases : reste entre 0 et 30ms.
export const VOICE_BLOCK_GAP_MS = 20;
// Regroupe les phrases courtes dans un même bloc de lecture au lieu de
// marquer une pause à chaque point — c'est ça qui évite le débit haché.
export const VOICE_BLOCK_MAX_CHARS = 200;
// Chrome met en pause la synthèse vocale toute seule au bout d'environ 15s de
// lecture continue (bug connu) — on rappelle resume() à intervalle régulier
// pour contourner ça, sans effet sur les navigateurs non concernés.
const VOICE_RESUME_WORKAROUND_MS = 10_000;

// Logs de diagnostic temporaires pour tracer précisément ce qui coupe la
// voix (démarrage/fin de chaque bloc, erreurs, et CHAQUE appel à
// speechSynthesis.cancel() avec sa raison). Repasser à false une fois le
// souci confirmé résolu en production.
const VOICE_DEBUG = true;
export function voiceLog(...args: unknown[]) {
  if (VOICE_DEBUG && typeof console !== 'undefined') console.log('[voix]', ...args);
}

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
// par défaut, ET plus jeune/chaleureuse qu'une voix de standard téléphonique.
// Ordre de priorité : voix féminine française moderne de type Neural/Natural
// (ex: "Microsoft Denise Natural") > Neural/Natural générique > Google >
// voix locales de qualité connues (Apple) > n'importe quelle voix de la
// langue en dernier recours.
const NEURAL_HINTS = ['neural', 'natural'];
const GOOGLE_HINT = 'google';
const QUALITY_LOCAL_NAMES = ['amélie', 'amelie', 'thomas', 'aurélie', 'aurelie', 'audrey'];
// Prénoms de voix françaises féminines connues, pour repérer les voix
// modernes qui sonnent le plus jeune/dynamique (Web Speech API n'expose pas
// de champ "genre" — seule la détection par nom est possible).
const YOUNG_FEMALE_HINTS = ['denise', 'julie', 'joséphine', 'josephine', 'charlotte', 'céline', 'celine', 'léa', 'lea', 'hortense', 'éloise', 'eloise', 'brigitte'];

function voiceQualityScore(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  const isNeural = NEURAL_HINTS.some(h => name.includes(h));
  const isYoungFemale = YOUNG_FEMALE_HINTS.some(h => name.includes(h));
  if (isNeural && isYoungFemale) return 5;
  if (isNeural) return 4;
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

// Abréviations courantes après lesquelles un "." ne termine PAS une phrase.
const DOT_ABBREVIATIONS = ['m', 'mme', 'mlle', 'dr', 'etc', 'ex', 'cf', 'vs', 'n', 'art', 'st'];

function endsWithAbbreviation(before: string): boolean {
  const match = before.match(/([a-zàâäéèêëïîôöùûüç]+)$/i);
  return !!match && DOT_ABBREVIATIONS.includes(match[1].toLowerCase());
}

// Découpe un texte en phrases sur . ! ? … tout en évitant les fausses coupures
// sur les abréviations (M., Mme, etc.), les nombres décimaux (14.5) et les
// adresses (trouvetout224.site) — un "." ne termine une phrase que s'il est
// suivi d'un espace puis d'une majuscule/chiffre, ou de la fin du texte.
export function splitIntoSentences(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  const sentences: string[] = [];
  let start = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char !== '.' && char !== '!' && char !== '?' && char !== '…') continue;

    // Avale toute ponctuation terminale collée (ex: "?!", "...")
    let end = i;
    while (end + 1 < cleaned.length && '.!?…'.includes(cleaned[end + 1])) end++;

    let boundary = true;
    if (char === '.') {
      const before = cleaned.slice(start, i);
      const after = cleaned.slice(end + 1);
      if (endsWithAbbreviation(before)) {
        boundary = false;
      } else if (/\d$/.test(before) && /^\d/.test(after)) {
        boundary = false; // nombre décimal, ex: 14.5
      } else if (after.length > 0) {
        const m = after.match(/^(\s*)(.)/);
        // Pas d'espace après le point (ex: "trouvetout224.site") → pas une fin de phrase.
        // Espace suivi d'une minuscule → on considère que ça continue la même idée.
        if (!m || m[1].length === 0 || !/[A-ZÀ-Ý0-9]/.test(m[2])) boundary = false;
      }
    }

    if (boundary) {
      sentences.push(cleaned.slice(start, end + 1).trim());
      start = end + 1;
    }
    i = end;
  }

  const rest = cleaned.slice(start).trim();
  if (rest) sentences.push(rest);

  return sentences.filter(Boolean);
}

// Regroupe des phrases courtes dans un même bloc de lecture (jusqu'à ~200
// caractères) au lieu de marquer une pause à chaque point — c'est le
// changement principal qui rend le débit fluide au lieu de haché.
export function groupSentencesIntoBlocks(sentences: string[], maxChars: number = VOICE_BLOCK_MAX_CHARS): string[] {
  const blocks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (current && current.length + 1 + s.length > maxChars) {
      blocks.push(current);
      current = s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

export interface SpeakVoiceOptions {
  lang: string;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SpeakQueueHandle {
  cancel: (reason?: string) => void;
}

// Lit une liste de blocs de texte l'un après l'autre avec un gap quasi nul
// entre chacun (VOICE_BLOCK_GAP_MS), plutôt qu'un seul énorme bloc de texte
// (qui a tendance à couper ou décrocher sur les réponses longues) ou qu'une
// pause marquée à chaque phrase (qui rend le débit haché). cancel() arrête
// tout proprement (le bloc en cours ET la suite de la file), pour ne jamais
// laisser la file continuer après une interruption ni deux lectures se
// chevaucher. Si un bloc échoue (onerror), on enchaîne quand même sur le
// suivant au lieu de tout arrêter en silence.
export function speakSentenceQueue(
  blocks: string[],
  opts: SpeakVoiceOptions,
  onEnd: () => void,
  onError?: () => void
): SpeakQueueHandle {
  if (typeof window === 'undefined' || !window.speechSynthesis || blocks.length === 0) {
    onEnd();
    return { cancel: () => {} };
  }

  voiceLog(`nouvelle file : ${blocks.length} bloc(s), ${blocks.join(' ').length} caractères au total`);
  voiceLog("cancel() → purge d'un éventuel reliquat avant de démarrer cette nouvelle file");
  window.speechSynthesis.cancel();

  // Toutes les utterances sont construites À L'AVANCE (le bloc suivant est
  // donc déjà "prêt" pendant que le précédent se termine — aucun temps de
  // construction à l'enchaînement), ET conservées dans ce tableau pendant
  // toute la durée de la file : sur certaines versions de Chrome, une
  // SpeechSynthesisUtterance sans référence JS externe peut être récupérée
  // par le garbage collector EN PLEINE LECTURE, ce qui coupe la voix net
  // sans la moindre erreur — bug classique et bien documenté.
  const utterances = blocks.map((text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang;
    if (opts.voice) u.voice = opts.voice;
    u.rate = opts.rate;
    u.pitch = opts.pitch;
    u.volume = opts.volume;
    return u;
  });

  let index = 0;
  let cancelled = false;
  let gapTimer: ReturnType<typeof setTimeout> | null = null;

  // Contournement du bug Chrome qui met la synthèse en pause après ~15s.
  const resumeTimer = setInterval(() => {
    if (!cancelled) {
      voiceLog('resume() périodique (contournement de la pause auto de Chrome ~15s)');
      window.speechSynthesis.resume();
    }
  }, VOICE_RESUME_WORKAROUND_MS);

  const finish = () => {
    if (cancelled) return;
    cancelled = true;
    clearInterval(resumeTimer);
    if (gapTimer) clearTimeout(gapTimer);
  };

  const speakNext = () => {
    if (cancelled) return;
    if (index >= utterances.length) {
      voiceLog('file terminée — tous les blocs ont été lus');
      finish();
      onEnd();
      return;
    }
    const blockIndex = index;
    const utterance = utterances[blockIndex];
    index += 1;
    const isLast = index >= utterances.length;

    utterance.onstart = () => {
      voiceLog(`bloc ${blockIndex + 1}/${utterances.length} démarré (${blocks[blockIndex].length} car.)`);
    };
    utterance.onend = () => {
      voiceLog(`bloc ${blockIndex + 1}/${utterances.length} terminé`);
      if (cancelled) return;
      if (VOICE_BLOCK_GAP_MS > 0) gapTimer = setTimeout(speakNext, VOICE_BLOCK_GAP_MS);
      else speakNext();
    };
    utterance.onerror = (ev: any) => {
      voiceLog(`ERREUR sur le bloc ${blockIndex + 1}/${utterances.length} : ${ev?.error || 'inconnue'}`);
      if (cancelled) return;
      // Ne stoppe pas tout en silence : s'il reste des blocs, on les lit quand même.
      if (isLast) {
        finish();
        onError ? onError() : onEnd();
      } else {
        speakNext();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  speakNext();

  return {
    cancel: (reason?: string) => {
      voiceLog(`cancel() appelé — raison : ${reason || 'non précisée'}`);
      finish();
      window.speechSynthesis.cancel();
    },
  };
}
