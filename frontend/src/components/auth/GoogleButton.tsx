'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';

interface GoogleButtonProps {
  onCredential: (idToken: string) => void;
  text?: 'signin_with' | 'signup_with';
}

// Bouton "Se connecter avec Google" — utilise Google Identity Services (GIS).
// Le SDK renvoie un id_token (JWT) signé par Google, jamais des données brutes du client :
// c'est ce token qui est envoyé au backend, qui le revérifie lui-même auprès de Google.
// Ne s'affiche pas si la clé publique n'est pas configurée (évite un bouton cassé en local
// tant que l'utilisateur n'a pas encore rempli NEXT_PUBLIC_GOOGLE_CLIENT_ID).
export default function GoogleButton({ onCredential, text = 'signin_with' }: GoogleButtonProps) {
  const t = useTranslations('auth.googleButton');
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !clientId || !containerRef.current) return;
    const g = (window as any).google;
    if (!g?.accounts?.id) return;

    g.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => onCredential(response.credential),
    });
    // Largeur calculée depuis le conteneur réel (GIS accepte 200 à 400px) pour éviter
    // que le bouton déborde sur petits écrans mobiles (ex: 360px fixe > largeur dispo sur iPhone SE).
    const width = Math.min(400, Math.max(200, containerRef.current.offsetWidth));
    g.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width,
      text,
      logo_alignment: 'left',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, clientId, text]);

  // DEBUG TEMPORAIRE : au lieu de disparaître silencieusement si la variable
  // est absente, on affiche un message visible pour distinguer un problème
  // de rendu (import cassé) d'un problème de lecture de variable d'env.
  // À retirer une fois le diagnostic terminé.
  if (!clientId) {
    return (
      <div className="w-full border-2 border-dashed border-red-400 rounded-2xl py-3.5 text-center text-red-500 text-sm font-medium">
        {t('debugMissingClientId')}
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="w-full flex justify-center" />
    </>
  );
}
