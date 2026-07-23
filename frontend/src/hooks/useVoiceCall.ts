'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import {
  getSpeechRecognitionCtor, isVoiceCallSupported, speechLangFor, pickBestVoice,
  requestMicAccess, collectMicDiagnostics, cleanTextForSpeech, splitIntoSentences, groupSentencesIntoBlocks, speakSentenceQueue, voiceLog,
  MicErrorKind, MicDiagnostics, SpeakQueueHandle,
  VOICE_DEFAULT_PITCH, VOICE_DEFAULT_VOLUME,
} from '@/lib/webSpeech';
import { useVoicePrefsStore } from '@/store/voicePrefs.store';

const HEARTBEAT_INTERVAL_MS = 10_000;
const LOW_TIME_WARNING_SECONDS = 60;

export type VoiceCallState =
  | 'idle'
  | 'checking'
  | 'unsupported'
  | 'permission-explain'
  | 'requesting-mic'
  | 'mic-denied'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'quota-exceeded'
  | 'error'
  | 'ended';

export interface VoiceTurn {
  role: 'user' | 'model';
  text: string;
}

export interface VoiceQuotaInfo {
  tier: 'ANONYMOUS' | 'FREE_USER' | 'MANSA';
  limitSeconds: number;
  remainingSeconds: number;
  resetAt: string;
}

export function useVoiceCall() {
  const locale = useLocale();
  const [state, setState] = useState<VoiceCallState>('idle');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [quota, setQuota] = useState<VoiceQuotaInfo | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showLowTimeWarning, setShowLowTimeWarning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [micErrorKind, setMicErrorKind] = useState<MicErrorKind | null>(null);
  const [micDiagnostics, setMicDiagnostics] = useState<MicDiagnostics | null>(null);

  const stateRef = useRef<VoiceCallState>('idle');
  stateRef.current = state;
  const activeRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lowTimeWarnedRef = useRef(false);
  const micRequestInFlightRef = useRef(false);
  const speakQueueRef = useRef<SpeakQueueHandle | null>(null);
  const speakGenerationRef = useRef(0);
  // true seulement pendant qu'on VEUT que le micro écoute. Mis à false dès
  // qu'on arrête la reconnaissance pour traiter une réponse (thinking/speaking),
  // remis à true seulement quand la lecture vocale COMPLÈTE est terminée. On
  // utilise une ref (et pas juste state) car les évènements onend/onerror de
  // SpeechRecognition peuvent se déclencher avant que React n'ait re-rendu
  // avec le nouvel état — stateRef.current seul n'est pas assez fiable pour
  // empêcher le micro de se réactiver pendant que l'IA parle encore.
  const listeningIntentRef = useRef(false);
  // Empêche un évènement onresult PARASITE (le navigateur peut renvoyer un
  // second résultat "final" juste après recognition.stop(), notamment si
  // l'utilisateur parlait encore) de déclencher un DEUXIÈME appel Gemini +
  // une deuxième lecture vocale qui annulerait la première en plein milieu.
  // Remis à false uniquement quand une nouvelle session d'écoute démarre.
  const finalHandledRef = useRef(false);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const stopEverything = useCallback(() => {
    activeRef.current = false;
    listeningIntentRef.current = false;
    clearHeartbeat();
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try { recognitionRef.current.abort(); } catch {}
    }
    speakQueueRef.current?.cancel('stopEverything (raccroché / reset / démontage)');
    speakQueueRef.current = null;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, [clearHeartbeat]);

  const endCall = useCallback(async (reason: 'USER_HANGUP' | 'ERROR' = 'USER_HANGUP', nextState: VoiceCallState = 'ended') => {
    stopEverything();
    const sid = sessionIdRef.current;
    sessionIdRef.current = null;
    setState(nextState);
    if (sid) {
      try { await api.post('/voice/end', { sessionId: sid, reason }); } catch {}
    }
  }, [stopEverything]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) return;
    heartbeatRef.current = setInterval(async () => {
      if (!sessionIdRef.current || !activeRef.current) return;
      try {
        const res = await api.post('/voice/heartbeat', { sessionId: sessionIdRef.current });
        if (res.data.quota) {
          setQuota(res.data.quota);
          setRemainingSeconds(res.data.quota.remainingSeconds);
        }
        if (!res.data.allowed) {
          endCall('USER_HANGUP', 'quota-exceeded');
        }
      } catch {
        // Panne réseau transitoire sur le heartbeat : on ignore, le prochain réessaiera.
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [endCall]);

  const restartListening = useCallback(() => {
    if (!activeRef.current) return;
    listeningIntentRef.current = true;
    finalHandledRef.current = false;
    try {
      recognitionRef.current?.start();
      setState('listening');
    } catch {
      setTimeout(() => {
        if (!activeRef.current) return;
        try { recognitionRef.current?.start(); setState('listening'); } catch {}
      }, 300);
    }
  }, []);

  // Lit une réponse à voix haute : nettoie le texte (emojis, markdown, URLs),
  // le regroupe en blocs (pas une pause à chaque phrase — voir
  // groupSentencesIntoBlocks) pour un débit fluide, et choisit la meilleure
  // voix disponible selon la préférence sauvegardée par l'utilisateur
  // (Paramètres > Apparence > Voix de l'assistant) ou, à défaut, la meilleure
  // voix détectée automatiquement.
  //
  // listeningIntentRef reste à false pendant TOUTE la durée de la lecture
  // (y compris l'attente async de pickBestVoice) : le micro ne doit se
  // réactiver qu'après l'évènement onend du DERNIER bloc, jamais avant.
  // speakGenerationRef évite que deux lectures se chevauchent si speak() est
  // appelée une seconde fois avant que la sélection de voix (async) de la
  // première n'ait résolu.
  const speak = useCallback((text: string, onDone?: () => void) => {
    const myGeneration = ++speakGenerationRef.current;
    voiceLog(`speak() appelée (génération #${myGeneration}) — ${text.length} caractères`);
    listeningIntentRef.current = false;
    speakQueueRef.current?.cancel(`nouvel appel à speak() (génération #${myGeneration}) prend le dessus`);
    speakQueueRef.current = null;
    if (typeof window === 'undefined' || !window.speechSynthesis) { onDone?.(); return; }

    const lang = speechLangFor(locale);
    const blocks = groupSentencesIntoBlocks(splitIntoSentences(cleanTextForSpeech(text)));
    const { voiceURI, rate } = useVoicePrefsStore.getState();

    const finish = () => {
      if (speakGenerationRef.current !== myGeneration) {
        voiceLog(`finish() ignoré (génération #${myGeneration} périmée, actuelle #${speakGenerationRef.current})`);
        return;
      }
      speakQueueRef.current = null;
      if (onDone) onDone();
      else restartListening();
    };

    setState('speaking');
    pickBestVoice(lang, voiceURI).then((voice) => {
      // Une lecture plus récente a déjà pris le dessus pendant cette attente async.
      if (speakGenerationRef.current !== myGeneration) {
        voiceLog(`génération #${myGeneration} abandonnée avant démarrage (périmée par #${speakGenerationRef.current})`);
        return;
      }
      voiceLog(`voix choisie pour la génération #${myGeneration} :`, voice?.name || '(voix par défaut du navigateur)');
      speakQueueRef.current = speakSentenceQueue(
        blocks,
        { lang, voice, rate, pitch: VOICE_DEFAULT_PITCH, volume: VOICE_DEFAULT_VOLUME },
        finish,
        finish
      );
    });
  }, [locale, restartListening]);

  const handleFinalTranscript = useCallback(async (text: string) => {
    voiceLog('transcription finale reçue, micro coupé pour traiter le tour :', text);
    listeningIntentRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    setInterimTranscript('');
    setTurns(t => [...t, { role: 'user', text }]);
    setState('thinking');

    try {
      const res = await api.post('/voice/chat', { sessionId: sessionIdRef.current, message: text });
      const reply: string = res.data.reply;
      voiceLog('réponse Gemini reçue, lecture à voix haute :', reply);
      setTurns(t => [...t, { role: 'model', text: reply }]);
      speak(reply);
    } catch (e: any) {
      const code = e?.response?.data?.code;
      const msg: string = e?.response?.data?.error || 'Désolé, un souci technique est survenu.';
      if (code === 'VOICE_QUOTA_EXCEEDED') {
        if (e?.response?.data?.quota) setQuota(e.response.data.quota);
        endCall('USER_HANGUP', 'quota-exceeded');
        return;
      }
      setTurns(t => [...t, { role: 'model', text: msg }]);
      setErrorMessage(msg);
      speak(msg, () => endCall('ERROR', 'error'));
    }
  }, [speak, endCall]);

  const createRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return null;
    const recognition = new Ctor();
    recognition.lang = speechLangFor(locale);
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState('listening');
      startHeartbeat();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      setInterimTranscript(interim);
      if (final.trim() && !finalHandledRef.current) {
        finalHandledRef.current = true;
        handleFinalTranscript(final.trim());
      } else if (final.trim()) {
        voiceLog('résultat final PARASITE ignoré (un tour est déjà en cours de traitement) :', final.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied' || event.error === 'service-not-allowed') {
        collectMicDiagnostics({ name: event.error }).then(setMicDiagnostics);
        setMicErrorKind('denied');
        setState('mic-denied');
        endCall('ERROR', 'mic-denied');
        return;
      }
      if (event.error === 'audio-capture') {
        collectMicDiagnostics({ name: event.error }).then(setMicDiagnostics);
        setMicErrorKind('no-device');
        setState('mic-denied');
        endCall('ERROR', 'mic-denied');
        return;
      }
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Personne n'a parlé pendant le délai d'écoute — on relance simplement,
        // mais SEULEMENT si on est censé être en train d'écouter (jamais pendant
        // que l'IA réfléchit ou parle encore — listeningIntentRef est fiable de
        // façon synchrone, contrairement au state React qui peut avoir un temps
        // de retard sur cet évènement navigateur).
        if (activeRef.current && listeningIntentRef.current) restartListening();
        return;
      }
      // Erreur réseau ou autre : on retente une fois l'écoute, sinon on abandonne proprement.
      if (activeRef.current && listeningIntentRef.current) restartListening();
    };

    recognition.onend = () => {
      // Le navigateur arrête parfois l'écoute tout seul après un silence — si on
      // est censé être encore en train d'écouter, on relance. Ne JAMAIS relancer
      // pendant que l'IA réfléchit ou parle (listeningIntentRef à false le temps
      // de tout ce cycle).
      if (activeRef.current && listeningIntentRef.current) {
        restartListening();
      }
    };

    return recognition;
  }, [locale, startHeartbeat, handleFinalTranscript, endCall, restartListening]);

  // Étape 1 : appui sur "Appeler l'assistant" — vérifie le quota côté serveur
  // et la compatibilité navigateur AVANT toute demande de micro.
  const requestStart = useCallback(async () => {
    setErrorMessage('');
    setMicErrorKind(null);
    setState('checking');
    try {
      const res = await api.post('/voice/start');
      if (res.data.quota) {
        setQuota(res.data.quota);
        setRemainingSeconds(res.data.quota.remainingSeconds);
      }
      if (!res.data.allowed) {
        setState('quota-exceeded');
        return;
      }
      sessionIdRef.current = res.data.sessionId;

      if (!isVoiceCallSupported()) {
        setState('unsupported');
        api.post('/voice/end', { sessionId: res.data.sessionId, reason: 'ERROR' }).catch(() => {});
        sessionIdRef.current = null;
        return;
      }
      setState('permission-explain');
    } catch {
      setErrorMessage("Impossible de démarrer l'appel pour le moment.");
      setState('error');
    }
  }, []);

  // Étape 2 : l'utilisateur a lu l'explication (ou clique "Réessayer" après un
  // refus) — on revérifie l'état RÉEL du micro à CHAQUE tentative via
  // getUserMedia, jamais depuis un état mis en cache côté app.
  //
  // Cette fonction est appelée SYNCHRONEMENT depuis onClick (pas de useEffect,
  // pas de setTimeout avant) : requestMicAccess() est le tout premier await de
  // la pile d'appel, ce qui préserve le "geste utilisateur" exigé par les
  // navigateurs pour autoriser la demande de permission micro. Le garde-fou
  // micRequestInFlightRef évite qu'un double-clic déclenche deux demandes en
  // parallèle (qui se bloqueraient mutuellement).
  const confirmAndListen = useCallback(async () => {
    if (micRequestInFlightRef.current) return;
    micRequestInFlightRef.current = true;
    setState('requesting-mic');
    setMicErrorKind(null);

    try {
      const access = await requestMicAccess();
      setMicDiagnostics(access.diagnostics);
      if (!access.ok) {
        setMicErrorKind(access.kind);
        setState('mic-denied');
        return;
      }

      activeRef.current = true;
      lowTimeWarnedRef.current = false;
      setTurns([]);
      const recognition = createRecognition();
      if (!recognition) {
        setState('unsupported');
        return;
      }
      recognitionRef.current = recognition;
      try {
        listeningIntentRef.current = true;
        finalHandledRef.current = false;
        recognition.start();
      } catch {
        listeningIntentRef.current = false;
        setMicErrorKind('unknown');
        setState('mic-denied');
      }
    } finally {
      micRequestInFlightRef.current = false;
    }
  }, [createRecognition]);

  // Pendant qu'on affiche l'écran "micro refusé", on écoute les changements de
  // permission en direct : si l'utilisateur autorise le micro depuis les
  // réglages du navigateur sans revenir sur l'app, l'appel redémarre tout
  // seul — pas besoin de recharger la page ni de recliquer sur "Réessayer".
  useEffect(() => {
    if (state !== 'mic-denied' || micErrorKind !== 'denied') return;
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return;
    let cancelled = false;
    let status: any = null;
    const handleChange = () => {
      if (!cancelled && status?.state === 'granted') confirmAndListen();
    };
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((s) => {
        if (cancelled) return;
        status = s;
        status.addEventListener('change', handleChange);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      status?.removeEventListener?.('change', handleChange);
    };
  }, [state, micErrorKind, confirmAndListen]);

  const interrupt = useCallback(() => {
    // cancel() sur la file ET sur speechSynthesis : sans ça, la file continuerait
    // d'enchaîner les phrases suivantes après l'arrêt de la phrase en cours.
    speakQueueRef.current?.cancel('bouton "couper la voix" cliqué par l\'utilisateur');
    speakQueueRef.current = null;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, []);

  const hangup = useCallback(() => {
    endCall('USER_HANGUP', 'ended');
  }, [endCall]);

  const reset = useCallback(() => {
    stopEverything();
    sessionIdRef.current = null;
    setState('idle');
    setTurns([]);
    setInterimTranscript('');
    setErrorMessage('');
    setMicErrorKind(null);
    setMicDiagnostics(null);
    setShowLowTimeWarning(false);
  }, [stopEverything]);

  // Décompte local seconde par seconde pour un affichage fluide — resynchronisé
  // à chaque heartbeat (toutes les 10s) avec la valeur autoritaire du serveur.
  useEffect(() => {
    if (!['listening', 'thinking', 'speaking'].includes(state)) return;
    const t = setInterval(() => setRemainingSeconds(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (
      ['listening', 'thinking', 'speaking'].includes(state) &&
      remainingSeconds > 0 &&
      remainingSeconds <= LOW_TIME_WARNING_SECONDS &&
      !lowTimeWarnedRef.current
    ) {
      lowTimeWarnedRef.current = true;
      setShowLowTimeWarning(true);
    }
  }, [state, remainingSeconds]);

  // Filet de sécurité : si le composant disparaît pendant un appel actif
  // (fermeture de la fenêtre, navigation), on prévient le serveur.
  useEffect(() => {
    return () => {
      if (activeRef.current && sessionIdRef.current) {
        stopEverything();
        navigator.sendBeacon?.(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/voice/end`,
          new Blob([JSON.stringify({ sessionId: sessionIdRef.current, reason: 'USER_HANGUP' })], { type: 'application/json' })
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    turns,
    interimTranscript,
    quota,
    remainingSeconds,
    showLowTimeWarning,
    dismissLowTimeWarning: () => setShowLowTimeWarning(false),
    errorMessage,
    micErrorKind,
    micDiagnostics,
    requestStart,
    confirmAndListen,
    interrupt,
    hangup,
    reset,
  };
}
