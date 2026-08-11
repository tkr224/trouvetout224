'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { isNativeApp } from '@/lib/native';

interface GoogleButtonProps {
  onCredential: (idToken: string) => void;
  text?: 'signin_with' | 'signup_with';
}

// Bouton "Se connecter avec Google".
//
// ── Deux implémentations, un seul contrat ────────────────────────────────
// Dans les deux cas le composant remonte un id_token (JWT signé par Google)
// via `onCredential`, que le backend revérifie lui-même auprès de Google.
// Les pages appelantes n'ont donc rien à changer.
//
//  • NAVIGATEUR → Google Identity Services (GIS), widget officiel.
//  • APP ANDROID → connexion native (Credential Manager) via le plugin
//    Capacitor. C'est OBLIGATOIRE : Google refuse ses flux OAuth dans les
//    WebView embarquées et renvoie l'erreur `disallowed_useragent`. Le
//    widget GIS ne fonctionnerait tout simplement pas dans l'app.
export default function GoogleButton({ onCredential, text = 'signin_with' }: GoogleButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [native, setNative] = useState(false);

  // `isNativeApp()` interroge `window` : on ne l'évalue qu'après le montage
  // pour que le rendu serveur et la première passe client concordent.
  useEffect(() => { setNative(isNativeApp()); }, []);

  if (!clientId) return null;
  return native
    ? <GoogleButtonNative clientId={clientId} onCredential={onCredential} text={text} />
    : <GoogleButtonWeb    clientId={clientId} onCredential={onCredential} text={text} />;
}

/* ══ Version navigateur — widget Google Identity Services ═══════════════ */
function GoogleButtonWeb({ clientId, onCredential, text }: GoogleButtonProps & { clientId: string }) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [dark, setDark] = useState(false);

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
    if (!scriptReady || !containerRef.current) return;
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
  }, [scriptReady, clientId, text, dark, locale, onCredential]);

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

/* ══ Version app Android — Credential Manager natif ════════════════════ */
function GoogleButtonNative({ clientId, onCredential, text }: GoogleButtonProps & { clientId: string }) {
  const t = useTranslations('auth.google');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Le plugin est importé dynamiquement : il embarque du code natif et n'a
  // rien à faire dans le bundle servi aux navigateurs.
  useEffect(() => {
    let cancelled = false;
    import('@capgo/capacitor-social-login')
      .then(({ SocialLogin }) => SocialLogin.initialize({
        // Sur Android, Credential Manager attend le Client ID **Web**, pas
        // celui de type Android : c'est lui qui détermine l'audience (`aud`)
        // de l'id_token, et le backend vérifie cette audience. Le Client ID
        // Android sert uniquement à autoriser la signature de l'APK côté
        // Google Cloud, il n'apparaît jamais dans le code.
        google: { webClientId: clientId },
      }))
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e) => console.error('[GoogleButton] initialize natif échoué', e));
    return () => { cancelled = true; };
  }, [clientId]);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const { SocialLogin } = await import('@capgo/capacitor-social-login');
      const res = await SocialLogin.login({
        provider: 'google',
        options: { scopes: ['email', 'profile'] },
      });
      const idToken = (res as any)?.result?.idToken;
      if (!idToken) throw new Error('Aucun id_token renvoyé par Google');
      onCredential(idToken);
    } catch (e) {
      // Annulation par l'utilisateur incluse : on ne montre pas d'erreur
      // agressive, on réactive simplement le bouton.
      console.error('[GoogleButton] connexion native échouée', e);
    } finally {
      setLoading(false);
    }
  }, [onCredential]);

  // Bouton conforme aux règles de marque Google : fond blanc, libellé
  // "Continuer avec Google", logo officiel quadrichromie, aucune couleur maison.
  return (
    <button
      type="button"
      onClick={signIn}
      disabled={!ready || loading}
      className="w-full flex items-center justify-center gap-3 h-12 rounded-full bg-white border border-[#747775] dark:border-[#8e918f] dark:bg-[#131314] text-[#1f1f1f] dark:text-[#e3e3e3] font-medium text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
    >
      {loading
        ? <Loader2 size={18} className="animate-spin" />
        : <GoogleLogo />}
      {text === 'signup_with' ? t('signUp') : t('signIn')}
    </button>
  );
}

/** Logo Google officiel (couleurs et tracés imposés par la charte Google). */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
