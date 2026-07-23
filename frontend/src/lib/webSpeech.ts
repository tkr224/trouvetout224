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

export async function pickVoiceFor(lang: string): Promise<SpeechSynthesisVoice | undefined> {
  const voices = await getVoices();
  const short = lang.slice(0, 2);
  return (
    voices.find(v => v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find(v => v.lang.toLowerCase().startsWith(short)) ||
    undefined
  );
}
