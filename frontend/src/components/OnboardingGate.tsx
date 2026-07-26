'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth.store';

const OnboardingSurvey = dynamic(() => import('./OnboardingSurvey'), { ssr: false });

// Seuil : on ne montre le sondage qu'aux comptes créés depuis moins de 30 jours
// (protège les utilisateurs existants lors de la migration)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function OnboardingGate() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated || !user) return;
    if (user.onboardingDone) return;
    // Les comptes admin ne doivent jamais voir ce sondage (basé sur le rôle en base,
    // donc pas de risque de réapparition après reconnexion/mise à jour).
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return;

    // Ne montre le sondage qu'aux comptes récents (≤ 30 jours)
    if (user.createdAt) {
      const age = Date.now() - new Date(user.createdAt).getTime();
      if (age > THIRTY_DAYS_MS) return;
    }

    // Petit délai pour laisser la page se charger d'abord
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [_hasHydrated, isAuthenticated, user]);

  if (!show) return null;
  return <OnboardingSurvey onClose={() => setShow(false)} />;
}
