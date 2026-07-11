'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

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
    g.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: 360,
      text,
      logo_alignment: 'left',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, clientId, text]);

  if (!clientId) return null;

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
