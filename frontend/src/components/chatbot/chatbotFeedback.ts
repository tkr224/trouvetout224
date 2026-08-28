// Sons courts synthétisés à la volée (Web Audio) — aucun fichier audio à charger,
// aucune dépendance externe, fonctionne hors-ligne.
let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  try {
    if (!sharedCtx) sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return sharedCtx;
  } catch {
    return null;
  }
}

function beep(freq: number, durationMs: number, volume: number) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {}
}

export function playSendSound() {
  beep(660, 70, 0.08);
}

export function playNotificationSound() {
  beep(880, 90, 0.1);
  setTimeout(() => beep(1100, 90, 0.08), 90);
}

export function vibrateShort() {
  try { navigator.vibrate?.(50); } catch {}
}
