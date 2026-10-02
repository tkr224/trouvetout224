// Événements d'activité impossibles à observer côté serveur (temps passé sur une
// annonce, clic WhatsApp / téléphone). Envoyés uniquement si l'utilisateur est
// connecté — le serveur ignore de toute façon les visiteurs et respecte le réglage
// "Personnaliser mon fil" (Paramètres > Personnalisation).
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function token(): string | null {
  try {
    return JSON.parse(localStorage.getItem('tt224-auth') || '{}')?.state?.accessToken || null;
  } catch {
    return null;
  }
}

function send(payload: Record<string, unknown>) {
  const tk = token();
  if (!tk) return;
  // keepalive : la requête part même si l'utilisateur quitte la page (fermeture d'onglet)
  fetch(`${BASE_URL}/activity`, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function trackDwell(annonceId: string, seconds: number) {
  if (seconds < 3) return;
  send({ type: 'DWELL', annonceId, seconds: Math.min(3600, Math.round(seconds)) });
}

export function trackContact(annonceId: string) {
  send({ type: 'CONTACT', annonceId });
}
