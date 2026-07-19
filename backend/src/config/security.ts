// Délai de sécurité anti-piratage : une information sensible (email, mot de
// passe, téléphone, questions de sécurité) ne peut pas être re-modifiée avant
// ce nombre de jours. N'affecte JAMAIS la première configuration (ex : premier
// mot de passe défini sur un compte Google) ni les flux de récupération
// légitimes ("mot de passe oublié") — voir les appelants pour le détail.
export const SENSITIVE_CHANGE_COOLDOWN_DAYS = 7;

const COOLDOWN_MS = SENSITIVE_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export interface CooldownStatus {
  blocked: boolean;
  nextAllowedAt: Date | null;
  daysRemaining: number;
}

// À appeler avec la date du dernier changement (ou null si jamais modifié).
export function checkCooldown(lastChangedAt: Date | null | undefined): CooldownStatus {
  if (!lastChangedAt) return { blocked: false, nextAllowedAt: null, daysRemaining: 0 };

  const nextAllowedAt = new Date(lastChangedAt.getTime() + COOLDOWN_MS);
  const blocked = nextAllowedAt.getTime() > Date.now();
  if (!blocked) return { blocked: false, nextAllowedAt: null, daysRemaining: 0 };

  const daysRemaining = Math.max(1, Math.ceil((nextAllowedAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return { blocked: true, nextAllowedAt, daysRemaining };
}

export function cooldownMessage(daysRemaining: number, nextAllowedAt: Date): string {
  const dateStr = nextAllowedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `Pour votre sécurité, vous pourrez modifier à nouveau cette information dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} (le ${dateStr}).`;
}
