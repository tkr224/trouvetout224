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
          // Les modèles Gemini récents "réfléchissent" avant de répondre, ce qui
          // consommait tout le budget de tokens avant même d'écrire le JSON
          // (réponse tronquée juste après "Here is the JSON..."). Cette tâche de
          // classification simple n'a pas besoin de ce raisonnement étendu.
          thinkingConfig: { thinkingBudget: 0 },
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
    console.error('[gemini.service] Erreur modération Gemini (fail-open, annonce publiée normalement) :', e?.message || e);
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
- Langues : seul le français est actif aujourd'hui sur le site. D'autres langues sont prévues plus tard mais pas encore disponibles.

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
    config: { systemInstruction: CHATBOT_SYSTEM_PROMPT, temperature: 0.4, maxOutputTokens: 400 },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text;
}
