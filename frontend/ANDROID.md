# App Android TrouveTout224 (Capacitor)

Projet Android généré par Capacitor 8, dans `frontend/android/`.
`appId` : **site.trouvetout224.app** · `appName` : **TrouveTout224**

---

## Comment l'app fonctionne

L'app est une coque native qui affiche **https://trouvetout224.site** dans une
WebView (`server.url` dans `capacitor.config.ts`).

**Pourquoi pas un export statique ?** `output: 'export'` est incompatible avec
ce projet : il refuse les `headers()` (nos en-têtes de sécurité + CSP), la route
API `/api/hero-images`, les pages `export const dynamic = 'force-dynamic'`
(accueil, liste d'annonces…) et le rendu serveur de next-intl qui lit le cookie
`NEXT_LOCALE`. Passer en statique demanderait de réécrire une grande partie du
site pour un gain nul, puisque tout le contenu vient de l'API de toute façon.

**Conséquences pratiques**
- Une seule base de code ; toute mise à jour du site est immédiate dans l'app,
  **sans repasser par la validation Play Store** (sauf changement natif).
- L'auth, les cookies, les WebSockets et les appels API marchent exactement
  comme dans le navigateur — même origine, aucun CORS supplémentaire.
- L'app exige une connexion internet. C'est déjà le cas du PWA actuel (le
  service worker ne met rien en cache). Si le site est injoignable au
  démarrage, la page de repli `capacitor-www/index.html`, embarquée dans
  l'APK, s'affiche avec un bouton « Réessayer ».

---

## Commandes du quotidien

```bash
cd frontend

npm run cap:sync      # répercute config + plugins dans android/  (après tout changement de capacitor.config.ts ou de plugin)
npm run cap:open      # ouvre le projet dans Android Studio
npm run cap:assets    # régénère icônes + splash depuis assets/ (voir plus bas)
```

Comme la WebView pointe sur le site en ligne, **`npm run build` n'a pas besoin
d'être relancé pour l'app** : déployer le site suffit.

---

## Icônes et splash screen

Sources dans `frontend/assets/`, régénérées depuis le logo du site
(`public/icons/icon-maskable-512.png`) :

| Fichier | Rôle |
|---|---|
| `icon.png` (1024²) | icône classique Android < 8 + Play Store |
| `icon-foreground.png` | loupe blanche, 52 % de la toile (zone sûre 66 % respectée) |
| `icon-background.png` | dégradé vert `#1B8B3B → #0F5F27` |
| `splash.png` / `splash-dark.png` (2732²) | écran de démarrage |

`npm run cap:assets` régénère les 136 déclinaisons de densité.

> ⚠️ Après un `cap:assets`, **revérifie**
> `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher*.xml` : l'outil y
> réintroduit des `<inset android:inset="16.7%">`. On les a retirés
> volontairement — sur le fond, l'inset laissait des bords vides avec les
> masques carrés (Samsung, Pixel) ; sur l'avant-plan, il rendait la loupe deux
> fois trop petite. Les deux fichiers doivent rester en `<background .../>` et
> `<foreground .../>` simples.

---

## Connexion Google dans la WebView

**Le point qui casse toujours** : Google **refuse** ses flux OAuth dans une
WebView embarquée et renvoie `disallowed_useragent`. Le widget Google Identity
Services (GIS) utilisé sur le site ne peut donc pas fonctionner dans l'app.

`src/components/auth/GoogleButton.tsx` gère les deux cas avec **le même
contrat** (`onCredential(idToken)`), donc les pages `/auth/connexion` et
`/auth/inscription` sont inchangées :

| Contexte | Implémentation | Résultat |
|---|---|---|
| Navigateur | widget GIS officiel | `id_token` |
| App Android | Credential Manager natif (`@capgo/capacitor-social-login`) | `id_token` |

Dans les deux cas le backend reçoit `POST /auth/oauth { provider:'google',
token }` et revérifie le token auprès de Google. **Rien à changer côté backend.**

Le plugin est chargé en import dynamique : il vit dans un chunk séparé de 43 Ko
que les navigateurs ne téléchargent jamais.

### Ce que tu dois faire dans Google Cloud Console

Credential Manager exige un **second** Client ID, de type Android, en plus du
Client ID Web existant :

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
   même projet que le Client ID Web actuel.
2. **Créer des identifiants → ID client OAuth → Android**
   - Nom du package : `site.trouvetout224.app`
   - Empreinte SHA-1 : celle de ta clé de signature (voir ci-dessous)
3. **Ne mets ce Client ID Android nulle part dans le code.** Il sert seulement
   à autoriser ta signature côté Google. Le code continue d'envoyer le Client
   ID **Web** (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`), qui définit l'audience (`aud`)
   de l'`id_token` que le backend vérifie.

Récupérer le SHA-1 :

```bash
# Clé de release (celle du Play Store)
keytool -list -v -keystore frontend/android/trouvetout224-release.jks -alias trouvetout224

# Clé de debug (pour tester sur ton téléphone avant publication)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

> Ajoute **les deux** SHA-1 (debug et release) dans Google Cloud, sinon la
> connexion Google marchera en test mais pas en production — ou l'inverse.

> Si tu actives **Play App Signing** (recommandé, et par défaut), Google
> **resigne** ton app avec sa propre clé. Il faut alors ajouter le SHA-1
> affiché dans *Play Console → Configuration → Intégrité de l'app*, en plus du
> tien. C'est la cause n°1 de « la connexion Google marche en local mais pas
> depuis le Play Store ».

---

## Micro et upload de photos

- **Micro** (appel vocal IA) : `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS` sont
  déclarés au manifeste. Capacitor demande la permission à l'exécution quand la
  WebView appelle `getUserMedia`. → **À déclarer dans la section « Sécurité des
  données » de la Play Console.**
- **Photos d'annonces** : Capacitor gère `<input type="file">` nativement
  (galerie + appareil photo) via le `FileProvider` déjà configuré. Aucune
  permission supplémentaire n'est nécessaire.

---

## App Links (optionnel)

Le manifeste déclare les liens `https://trouvetout224.site` avec `autoVerify`.
Pour qu'un lien partagé sur WhatsApp ouvre l'app directement, publie
`https://trouvetout224.site/.well-known/assetlinks.json` :

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "site.trouvetout224.app",
    "sha256_cert_fingerprints": ["TON_SHA256_ICI"]
  }
}]
```

Sans ce fichier rien ne casse : Android demande simplement à l'utilisateur
d'choisir entre l'app et le navigateur.

---

## Signature

Les identifiants de signature vivent dans `android/keystore.properties`
(**non versionné**, modèle fourni dans `keystore.properties.example`).
Tant que ce fichier n'existe pas, seuls les builds *debug* fonctionnent.

> 🔒 Sauvegarde le `.jks` **et** ses mots de passe hors du dépôt. Clé perdue =
> plus aucune mise à jour possible sous `site.trouvetout224.app`, jamais.
