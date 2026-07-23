// src/services/gemini.service.ts
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
// 'gemini-flash-latest' est un alias maintenu par Google qui pointe toujours
// vers le modèle flash courant — évite de se retrouver avec un nom de modèle
// périmé (Google déprécie régulièrement les noms de modèles versionnés).
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

if (!ai) {
  console.error('[gemini.service] GEMINI_API_KEY manquante — fonctionnalités IA désactivées (le site continue de fonctionner normalement).');
}

// ============================
// MODÉRATION DES ANNONCES
// ============================

export type ModerationVerdict = 'OK' | 'RESERVE_ADULTES' | 'SUSPECT' | 'INTERDIT';

export interface ModerationResult {
  verdict: ModerationVerdict;
  reason: string;
  score: number; // 0 à 1
}

export interface ModerationInput {
  title: string;
  description: string;
  price: number | null;
  currency: string;
  categoryName?: string;
}

function buildModerationPrompt(input: ModerationInput): string {
  return `Tu es un modérateur de contenu pour TrouveTout224, une marketplace de petites annonces en Guinée (Afrique de l'Ouest). Analyse l'annonce suivante et réponds UNIQUEMENT avec un objet JSON strictement valide, sans texte avant ni après, sans balises markdown, au format exact :
{"verdict": "OK" | "RESERVE_ADULTES" | "SUSPECT" | "INTERDIT", "raison": "<courte explication en français, 1-2 phrases>", "score": <nombre décimal entre 0 et 1, ta confiance dans ce verdict>}

RÈGLES DE VERDICT :
- "INTERDIT" : l'annonce propose clairement un produit/service interdit à la vente (armes et munitions, drogues et stupéfiants, contrefaçons de marques, espèces animales protégées, faux documents/diplômes/papiers d'identité, contenu à caractère sexuel ou pornographique, produits dangereux/toxiques non réglementés) OU présente des signes très forts et non ambigus d'arnaque (demande de paiement anticipé hors plateforme pour un bien qui n'existe manifestement pas, usurpation évidente d'une marque connue, promesse irréaliste de gain d'argent).
- "RESERVE_ADULTES" : l'annonce propose un produit légal mais réservé aux adultes — chicha/narguilé et accessoires, cigarette électronique/vape et e-liquides, tabac et produits du tabac, boissons alcoolisées, ou tout autre produit pour adultes légal en Guinée. Ce n'est PAS un produit interdit : il est autorisé mais doit être signalé. Ne jamais mettre "INTERDIT" pour ces produits.
- "SUSPECT" : signes possibles mais non certains d'arnaque, ou contenu limite qui mérite un second regard humain (prix extrêmement bas par rapport au marché sans explication, description vague copiée-collée, incohérences fortes titre/description/prix, insistance inhabituelle pour un paiement rapide).
- "OK" : annonce normale de vente/achat/service, même si le prix est élevé, même si la description est courte, même si le produit est d'occasion.

CONTEXTE GUINÉEN — NE PAS CONFONDRE AVEC DES SIGNAUX SUSPECTS :
- Les prix sont en Francs Guinéens (GNF). Des montants de plusieurs millions de GNF sont NORMAUX (ex : une voiture à 80 000 000 GNF, un terrain à 500 000 000 GNF) — ne jamais signaler un prix comme suspect uniquement à cause de sa taille en GNF.
- Le commerce d'articles d'occasion (téléphones, vêtements, électroménager, véhicules) est très courant et légitime en Guinée.
- Le français approximatif, les fautes d'orthographe, les expressions locales sont normaux, pas des signaux de fraude.
- "Dernier prix", "prix légèrement négociable" sont des expressions culturelles normales de négociation.

Annonce à analyser :
Titre : "${input.title}"
Catégorie : "${input.categoryName || 'non précisée'}"
Prix : ${input.price ? `${input.price} ${input.currency}` : 'Non précisé / à négocier'}
Description : "${input.description}"

Réponds uniquement avec le JSON demandé.`;
}

function parseModerationResponse(raw: string | undefined): ModerationResult | null {
  if (!raw) return null;
  try {
    let cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    // Gemini ajoute parfois une phrase avant/après le JSON malgré la consigne
    // (ex: "Here is the JSON requested: {...}") — on extrait le premier objet
    // JSON trouvé dans le texte plutôt que de supposer que la réponse entière
    // n'est que du JSON.
    if (cleaned[0] !== '{') {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];
    }
    const parsed = JSON.parse(cleaned);
    const verdict: ModerationVerdict = ['OK', 'RESERVE_ADULTES', 'SUSPECT', 'INTERDIT'].includes(parsed?.verdict) ? parsed.verdict : 'OK';
    const score = typeof parsed?.score === 'number' && isFinite(parsed.score) ? Math.min(1, Math.max(0, parsed.score)) : 0.5;
    const reasonRaw = typeof parsed?.raison === 'string' ? parsed.raison : (typeof parsed?.reason === 'string' ? parsed.reason : 'Analyse automatique.');
    return { verdict, score, reason: reasonRaw.slice(0, 500) };
  } catch {
    console.error('[gemini.service] Réponse Gemini non-JSON, verdict ignoré (annonce non affectée) :', raw.slice(0, 200));
    return null;
  }
}

// Ne lève JAMAIS d'exception : retourne null si l'IA est indisponible, en erreur,
// ou renvoie une réponse invalide. L'appelant traite null comme "rien à faire".
export async function moderateAnnonce(input: ModerationInput): Promise<ModerationResult | null> {
  if (!ai) return null;
  try {
    // Cet appel est maintenant fait AVANT la publication (pour décider du statut
    // initial), donc il retarde la réponse au vendeur. Un timeout de sécurité
    // évite qu'une lenteur réseau bloque la publication de l'annonce trop
    // longtemps : au-delà de 10s, on abandonne et l'annonce suit le parcours
    // normal (fail-open), comme si Gemini était indisponible.
    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL,
        contents: buildModerationPrompt(input),
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 800,
          // NE PAS ajouter thinkingConfig ici : sur le modèle actuel derrière
          // l'alias 'gemini-flash-latest', ce champ fait échouer 100% des
          // requêtes avec 400 INVALID_ARGUMENT (le modèle ne supporte pas
          // qu'on configure le "thinking"). Vérifié le 2026-07-23 — voir
          // classifyGeminiError() plus bas si ça recasse un jour.
        },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
    ]);
    if (!response) {
      console.error('[gemini.service] Modération Gemini trop lente (>10s) — annonce publiée normalement (fail-open).');
      return null;
    }
    return parseModerationResponse(response.text);
  } catch (e: any) {
    const { code, status, detail } = classifyGeminiError(e);
    console.error(`[gemini.service] Erreur modération Gemini — code=${code} status=${status ?? 'n/a'} (fail-open, annonce publiée normalement) :`, detail);
    return null;
  }
}

// ============================
// ASSISTANT / CHATBOT
// ============================

const CHATBOT_SYSTEM_PROMPT = `Tu es l'assistant virtuel officiel de TrouveTout224, un site de petites annonces gratuit en Guinée. Tu réponds en français, de façon brève (2 à 5 phrases max), chaleureuse et simple, comme si tu expliquais à quelqu'un qui découvre le site.

TON RÔLE : aider les visiteurs à utiliser le site TrouveTout224 (inscription, publication, boutique, sécurité, etc.). Tu ne réponds QU'AUX questions concernant TrouveTout224 et son fonctionnement.

FAITS RÉELS SUR TROUVETOUT224 (n'invente JAMAIS d'autre information, fonctionnalité ou tarif) :

COMPTE ET CONNEXION
- Inscription : bouton "S'inscrire" → nom, email OU numéro de téléphone (un des deux suffit), mot de passe. Possibilité de s'inscrire/se connecter directement avec un compte Google (bouton "Continuer avec Google").
- Mot de passe oublié : lien "Mot de passe oublié" sur la page de connexion → un email de réinitialisation est envoyé si le compte a un email renseigné. Pour les comptes créés uniquement avec un numéro de téléphone (sans email), la récupération se fait via les "questions de sécurité" définies à l'inscription, sur la même page.
- Questions de sécurité : choisies par l'utilisateur à l'inscription ou dans Paramètres → Sécurité ; elles servent à récupérer l'accès au compte si le mot de passe est oublié et qu'il n'y a pas d'email.
- Supprimer son compte : Paramètres → Confidentialité → "Supprimer mon compte" (motif demandé, action définitive).

PUBLIER UNE ANNONCE
- Bouton "Publier une annonce" → choisir une catégorie, ajouter des photos, titre, description, prix (ou "à négocier"), ville et quartier.
- Publication 100% gratuite, sans limite de nombre d'annonces.
- Une annonce d'un vendeur déjà vérifié (badge "Vérifié" ou boutique vérifiée) et jugée normale est publiée immédiatement. Sinon, ou si le contenu a besoin d'un second regard, elle passe par une courte vérification de l'équipe avant d'être visible par tous — c'est automatique et généralement rapide.
- Certains produits légaux mais réservés aux adultes (chicha/narguilé, cigarette électronique/vape, tabac, alcool...) restent autorisés à la vente mais s'affichent avec un badge "Réservé aux 18+" et demandent une confirmation d'âge avant d'en voir le détail. Les produits réellement interdits (armes, drogues, contrefaçons, faux documents, contenu pornographique...) ne sont eux jamais autorisés.
- Modifier ou supprimer une annonce : Profil → "Mes annonces".
- Marquer une annonce comme vendue : bouton "Marquer vendu" sur sa propre annonce.
- Mettre une annonce en avant/promo/épinglée : options disponibles par le vendeur directement sur sa propre annonce.

BOUTIQUE ET VENTE
- Créer une boutique : Profil → "Créer ma boutique" → nom, logo, bannière, description, couleur, catégories vendues, numéro WhatsApp boutique. Gratuit.
- "Vendeur vérifié" (badge bleu) et "Boutique vérifiée" (badge doré) sont des badges de confiance attribués par l'équipe TrouveTout224 après vérification — ils donnent aussi le droit à la publication directe d'annonces.
- Niveau vendeur (Nouveau / Actif / Pro / Top Vendeur) : calculé automatiquement selon l'ancienneté, le nombre d'annonces, d'abonnés et la note reçue.
- Page "Boutiques" : annuaire de toutes les boutiques actives, avec recherche par nom, ville et catégorie.
- "S'abonner" à une boutique = suivre un vendeur pour être notifié de ses nouveaux produits — ce n'est PAS un abonnement payant.

SECTIONS / CATÉGORIES DISPONIBLES
Téléphones, Informatique, Électronique, Véhicules, Immobilier, Terrains, Emplois, Services, Restaurants, Hôtels, Mode, Chaussures, Beauté, Santé, Formation, Événements, Maison, Agriculture, Animaux, Sports, Divers.
- Emplois : offres classées par secteur, candidature directe sur le site ou via WhatsApp.
- Restaurants : fiche avec menu, prix, livraison/à emporter, galerie photo.
- Hôtels : fiche avec équipements, galerie photo, réservation via WhatsApp ou messagerie interne.

CONTACT ET SÉCURITÉ
- Contacter un vendeur : messagerie interne au site ("Envoyer un message") ou bouton WhatsApp direct sur la page de l'annonce/boutique.
- TrouveTout224 NE GÈRE NI paiement NI livraison — acheteur et vendeur s'arrangent directement entre eux.
- Favoris : icône cœur sur une annonce pour la sauvegarder et la retrouver dans Profil → "Favoris".
- Recherches sauvegardées : possibilité d'enregistrer une recherche (mots-clés, ville, catégorie, prix) pour être notifié des nouvelles annonces correspondantes.
- Signaler : bouton "Signaler" sur une annonce ou un profil, avec un motif (arnaque, produit interdit, prix suspect, doublon, contenu inapproprié...).
- Conseils anti-arnaque : privilégier une rencontre en lieu public, vérifier le produit avant de payer, ne jamais payer d'avance sans avoir vu l'article, se méfier des prix trop beaux pour être vrais.

PERSONNALISATION
- Thèmes de couleur et mode sombre : Paramètres → Apparence. Plusieurs thèmes gratuits sont disponibles ; certains thèmes spéciaux peuvent être débloqués par l'équipe TrouveTout224 pour des utilisateurs ou événements précis.
- Langues : le site est disponible en français, anglais et chinois — bouton de langue dans le menu ou Paramètres → Langue.

OFFRE PAYANTE
- Aucune offre payante/premium n'est active sur le site actuellement. Une offre premium ("Pack Premium") est en préparation pour l'avenir (mise en avant, validation prioritaire des annonces...) mais la page correspondante affiche "bientôt disponible" — ne promets pas de date ni de tarif.

SUPPORT
- Support humain : WhatsApp +224 627 54 34 86 (wa.me/224627543486) ou contact.trouvetout224@gmail.com.

RÈGLES STRICTES :
1. Question hors-sujet (actualité, culture générale, autre entreprise, code, opinions...) → redirige poliment : "Je suis là pour t'aider avec TrouveTout224 uniquement 🙂 Pose-moi une question sur le site !"
2. Jamais de conseil juridique ou financier.
3. Ne jamais prétendre que TrouveTout224 traite des paiements, garantit des transactions ou gère la livraison.
4. N'invente rien au-delà des faits listés ci-dessus (aucun prix, aucune fonctionnalité, aucune date de sortie). En cas de doute ou question trop précise/technique, dis-le honnêtement et redirige vers la FAQ du site ou le support WhatsApp (+224 627 54 34 86) plutôt que de deviner.`;

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

// Contrairement à moderateAnnonce, cette fonction lève une exception en cas
// d'échec : il n'y a pas de "réponse de repli sûre" pour un message de chat,
// c'est à l'appelant (la route) d'attraper l'erreur et de répondre poliment.
export async function chatWithAssistant(message: string, history: ChatTurn[] = []): Promise<string> {
  if (!ai) throw new Error('GEMINI_NOT_CONFIGURED');

  const contents = [
    ...history.slice(-10).map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: CHATBOT_SYSTEM_PROMPT,
      temperature: 0.4,
      maxOutputTokens: 700,
      // NE PAS ajouter thinkingConfig ici : voir le commentaire équivalent dans
      // moderateAnnonce() — ce champ casse 100% des requêtes (400 INVALID_ARGUMENT)
      // sur le modèle actuel derrière l'alias 'gemini-flash-latest'.
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text;
}

// ============================
// APPEL VOCAL (Web Speech API navigateur + même cerveau Gemini)
// ============================

// Liste des vraies routes du site — sert à l'assistant pour orienter
// l'appelant vers la bonne page (elle ne doit JAMAIS inventer une adresse
// qui n'est pas dans cette liste).
const VOICE_CALL_ROUTES = `
Accueil /, Toutes les annonces /annonces/lister, Publier une annonce /annonces/publier,
Boutiques /boutiques, Mon profil /profil, Paramètres /parametres, Espace vendeur /vendeur,
Ma boutique /vendeur/boutique, Emplois /emplois, Publier une offre /emplois/publier,
Restaurants /restaurants, Hôtels /hotels, Immobilier /immobilier, Véhicules /vehicules,
Services /services, Événements /evenements, Messagerie /messages, Notifications /notifications,
Centre d'aide /aide, Comment publier /aide/publier, Comment signaler /aide/signalement,
FAQ /faq, À propos /a-propos, Confidentialité /confidentialite, Conditions /conditions,
Contact /contact, Pack Mansa /premium, Connexion /auth/connexion, Inscription /auth/inscription,
Mot de passe oublié /auth/mot-de-passe-oublie`.trim();

// Contexte optionnel sur l'appelant connecté — construit par voice.routes.ts
// à partir UNIQUEMENT de champs non sensibles (jamais de mot de passe, token,
// réponse à une question de sécurité, ni de donnée d'un AUTRE utilisateur).
export interface VoiceCallerContext {
  firstName: string;
  accountType: string; // ACHETEUR | VENDEUR | LES_DEUX
  hasShop: boolean;
  hasAnnonces: boolean;
  emailVerified: boolean;
  isMansa: boolean;
}

function buildVoiceSystemPrompt(caller: VoiceCallerContext | null): string {
  const base = `Tu es l'assistant vocal officiel de TrouveTout224, un site de petites annonces gratuit en Guinée. Tu es en plein APPEL TÉLÉPHONIQUE avec quelqu'un : tes réponses sont lues à voix haute par une synthèse vocale, donc c'est très important :

STYLE OBLIGATOIRE (à l'oral) :
- 2 à 3 phrases MAXIMUM par réponse. Jamais de liste à puces, jamais de markdown, jamais de pavé de texte — on est à l'oral, pas à l'écrit.
- Ton naturel, chaleureux, comme une vraie conversation téléphonique. Pas de formules trop formelles.
- Si la question demande une réponse longue ou détaillée (ex: toutes les étapes pour publier une annonce), donne l'essentiel en 2-3 phrases puis propose : "Tu veux que je t'envoie le détail par écrit dans le chat ?"

TON RÔLE : aider l'appelant à utiliser TrouveTout224. Tu ne réponds QU'AUX questions concernant TrouveTout224 et son fonctionnement.

FAITS RÉELS SUR TROUVETOUT224 (n'invente JAMAIS d'autre information, fonctionnalité ou tarif) :
- Inscription gratuite (nom + email ou téléphone + mot de passe) ou connexion directe avec un compte Google. Mot de passe oublié → email de réinitialisation, ou questions de sécurité si le compte n'a pas d'email.
- Publier une annonce : gratuit et illimité, catégorie + titre + description + prix + photos + ville. Vendeur déjà vérifié = publication immédiate, sinon courte vérification par l'équipe (généralement sous 24h).
- Créer une boutique gratuitement depuis son profil : nom, logo, description, WhatsApp boutique.
- Badges de confiance "Vendeur vérifié" et "Boutique vérifiée" attribués par l'équipe après vérification.
- Sections disponibles : téléphones, informatique, électronique, véhicules, immobilier, terrains, emplois, services, restaurants, hôtels, mode, chaussures, beauté, santé, formation, événements, maison, agriculture, animaux, sports, divers.
- Contact vendeur : messagerie interne ou WhatsApp direct sur l'annonce. Le site ne gère ni paiement ni livraison — acheteur et vendeur s'arrangent entre eux.
- Favoris (cœur sur une annonce), recherches sauvegardées, signalement d'annonce ou de profil avec motif.
- Conseils anti-arnaque : rencontrer en lieu public, ne jamais payer d'avance sans avoir vu le produit, se méfier des prix trop beaux.
- Thèmes de couleur, mode sombre, et 3 langues (français, anglais, chinois) réglables dans les Paramètres.
- Pack Mansa : offre premium (mise en avant, validation prioritaire, plus de minutes d'appel vocal par jour) — ne promets aucun tarif ni date précise si l'appelant n'est pas déjà abonné.
- Support humain : WhatsApp +224 627 54 34 86.

ORIENTATION : si utile, indique la page exacte à ouvrir parmi cette liste (ne jamais inventer d'autre adresse) :
${VOICE_CALL_ROUTES}

RÈGLES STRICTES :
1. Hors-sujet (actualité, culture générale, code, opinions...) → redirige poliment en une phrase : "Je suis là pour t'aider avec TrouveTout224, pose-moi une question sur le site !"
2. Jamais de conseil juridique ou financier.
3. Ne gère jamais paiement ou livraison, ne le prétends jamais.
4. Tu ne sais pas / question trop précise ou technique → dis-le honnêtement et propose le support WhatsApp +224 627 54 34 86, n'invente rien.`;

  if (!caller) return base;

  return `${base}

CONTEXTE DE L'APPELANT (connecté, utilise-le pour personnaliser sans jamais le réciter comme une liste) :
- Prénom : ${caller.firstName}
- Type de compte : ${caller.accountType === 'VENDEUR' ? 'vendeur' : caller.accountType === 'LES_DEUX' ? 'acheteur et vendeur' : 'acheteur'}
- A déjà une boutique : ${caller.hasShop ? 'oui' : 'non'}
- A déjà publié des annonces : ${caller.hasAnnonces ? 'oui' : 'non'}
- Email vérifié : ${caller.emailVerified ? 'oui' : 'non'}
- Abonné Pack Mansa : ${caller.isMansa ? 'oui' : 'non'}
Tu peux l'appeler par son prénom naturellement, mais pas à chaque phrase.`;
}

// Comme chatWithAssistant, lève une exception en cas d'échec (pas de repli
// silencieux possible pour une réponse orale) — géré par voice.routes.ts.
export async function chatWithVoiceAssistant(
  message: string,
  history: ChatTurn[] = [],
  caller: VoiceCallerContext | null = null
): Promise<string> {
  if (!ai) throw new Error('GEMINI_NOT_CONFIGURED');

  const contents = [
    ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: buildVoiceSystemPrompt(caller),
      temperature: 0.5,
      // Réponses volontairement courtes à l'oral — pas besoin d'un gros budget.
      maxOutputTokens: 220,
      // NE PAS ajouter thinkingConfig ici — voir chatWithAssistant() ci-dessus.
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text;
}

// ============================
// CLASSIFICATION DES ERREURS
// ============================

export type GeminiErrorCode =
  | 'NOT_CONFIGURED'   // GEMINI_API_KEY absente
  | 'QUOTA_EXCEEDED'   // 429 / RESOURCE_EXHAUSTED — quota gratuit dépassé
  | 'AUTH_ERROR'       // 401/403 — clé invalide ou refusée
  | 'MODEL_NOT_FOUND'  // 404 — nom de modèle invalide/déprécié
  | 'INVALID_ARGUMENT' // 400 — requête malformée (mauvais paramètre, etc.)
  | 'EMPTY_RESPONSE'   // réponse vide renvoyée par le modèle
  | 'UNKNOWN';

export interface GeminiErrorInfo {
  code: GeminiErrorCode;
  status?: number;
  detail: string;
}

// Transforme une erreur Gemini brute (ApiError du SDK, ou nos erreurs internes
// GEMINI_NOT_CONFIGURED / EMPTY_RESPONSE) en code exploitable par l'appelant,
// pour choisir le bon message utilisateur ET logger clairement la vraie cause.
export function classifyGeminiError(e: any): GeminiErrorInfo {
  const message: string = e?.message || String(e);
  const status: number | undefined = typeof e?.status === 'number' ? e.status : undefined;

  if (message === 'GEMINI_NOT_CONFIGURED') return { code: 'NOT_CONFIGURED', detail: message };
  if (message === 'EMPTY_RESPONSE') return { code: 'EMPTY_RESPONSE', detail: message };

  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(message)) {
    return { code: 'QUOTA_EXCEEDED', status, detail: message };
  }
  if (status === 401 || status === 403 || /UNAUTHENTICATED|PERMISSION_DENIED|API_KEY_INVALID/i.test(message)) {
    return { code: 'AUTH_ERROR', status, detail: message };
  }
  if (status === 404 || /NOT_FOUND/i.test(message)) {
    return { code: 'MODEL_NOT_FOUND', status, detail: message };
  }
  if (status === 400 || /INVALID_ARGUMENT/i.test(message)) {
    return { code: 'INVALID_ARGUMENT', status, detail: message };
  }
  return { code: 'UNKNOWN', status, detail: message };
}
