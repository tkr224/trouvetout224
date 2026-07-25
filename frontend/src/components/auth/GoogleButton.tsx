'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useLocale } from 'next-intl';

interface GoogleButtonProps {
  onCredential: (idToken: string) => void;
  text?: 'signin_with' | 'signup_with';
}

// Bouton "Se connecter avec Google" — utilise Google Identity Services (GIS).
// Le SDK renvoie un id_token (JWT) signé par Google, jamais des données brutes du client :
// c'est ce token qui est envoyé au backend, qui le revérifie lui-même auprès de Google.
//
// Le rendu (logo, texte, forme) est celui du widget officiel de Google : les règles de
// marque de Google interdisent un bouton entièrement personnalisé (couleurs/logo maison),
// seul un choix parmi leurs thèmes/formes prédéfinis est autorisé. On choisit ici la forme
// "pill" (coins totalement arrondis, cohérent avec le style du site) et un thème clair/sombre
// qui suit le thème actif du site — sans dépendre du détail interne du widget Google, donc
// rien ne peut casser si Google fait évoluer son rendu.
export default function GoogleButton({ onCredential, text = 'signin_with' }: GoogleButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [dark, setDark] = useState(false);

  // LOG TEMPORAIRE : confirme, depuis la console du navigateur en production, si la
  // variable est bien lue côté client. Le Client ID Google n'est pas un secret (il est
  // de toute façon visible dans les requêtes vers Google), donc l'afficher en entier ne
  // pose pas de risque. À retirer une fois le diagnostic terminé.
  useEffect(() => {
    console.log('[GoogleButton] NEXT_PUBLIC_GOOGLE_CLIENT_ID =', clientId || '(ABSENT)');
  }, [clientId]);

  // Suit le mode sombre du site (classe "dark" posée sur <html>) pour redessiner
  // le bouton Google avec le thème correspondant.
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!scriptReady || !clientId || !containerRef.current) return;
    const g = (window as any).google;
    if (!g?.accounts?.id) return;

    g.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => onCredential(response.credential),
    });
    // Largeur calculée depuis le conteneur réel (GIS accepte 200 à 400px) pour occuper
    // toute la largeur du formulaire, comme les autres champs/boutons.
    const width = Math.min(400, Math.max(200, containerRef.current.offsetWidth));
    containerRef.current.innerHTML = '';
    g.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme: dark ? 'filled_black' : 'outline',
      shape: 'pill',
      size: 'large',
      width,
      text,
      logo_alignment: 'left',
      locale: locale === 'zh' ? 'zh-CN' : locale,
    });
  }, [scriptReady, clientId, text, dark, locale]);

  // Variable absente : le bouton ne s'affiche simplement pas (plus de message de debug —
  // NEXT_PUBLIC_GOOGLE_CLIENT_ID est désormais correctement configurée).
  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />
    </>
  );
}
