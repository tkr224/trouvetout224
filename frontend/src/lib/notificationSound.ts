const STORAGE_KEY = 'tt224-notif-sound';

// Réglage son des notifications (Paramètres > Notifications) — local à l'appareil,
// activé par défaut. Utilisé par GlobalNotificationToasts pour respecter le choix de
// l'utilisateur avant de jouer le moindre son.
export function isNotificationSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {}
}

// Son court synthétisé (Web Audio) — aucun fichier audio à charger.
let sharedCtx: AudioContext | null = null;
export function playNotificationChime() {
  try {
    if (!sharedCtx) sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = sharedCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 740;
    gain.gain.value = 0.09;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.stop(now + 0.2);
  } catch {}
}
