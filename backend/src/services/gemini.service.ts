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

export type ModerationVerdict = 'OK' | 'SUSPECT' | 'INTERDIT';

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
{"verdict": "OK" | "SUSPECT" | "INTERDIT", "raison": "<courte explication en français, 1-2 phrases>", "score": <nombre décimal entre 0 et 1, ta confiance dans ce verdict>}

RÈGLES DE VERDICT :
- "INTERDIT" : l'annonce propose clairement un produit/service interdit à la vente (armes et munitions, drogues et stupéfiants, contrefaçons de marques, espèces animales protégées, faux documents/diplômes/papiers d'identité, contenu à caractère sexuel ou pornographique, produits dangereux/toxiques non réglementés) OU présente des signes très forts et non ambigus d'arnaque (demande de paiement anticipé hors plateforme pour un bien qui n'existe manifestement pas, usurpation évidente d'une marque connue, promesse irréaliste de gain d'argent).
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
    const verdict: ModerationVerdict = ['OK', 'SUSPECT', 'INTERDIT'].includes(parsed?.verdict) ? parsed.verdict : 'OK';
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
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildModerationPrompt(input),
      config: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 300 },
    });
    return parseModerationResponse(response.text);
  } catch (e: any) {
    console.error('[gemini.service] Erreur modération Gemini (fail-open, annonce publiée normalement) :', e?.message || e);
    return null;
  }
}

// ============================
// ASSISTANT / CHATBOT
// ============================

const CHATBOT_SYSTEM_PROMPT = `Tu es l'assistant virtuel officiel de TrouveTout224, un site de petites annonces gratuit en Guinée. Tu réponds en français, de façon brève (2 à 4 phrases max), chaleureuse et simple.

TON RÔLE : aider les visiteurs à utiliser le site TrouveTout224. Tu ne réponds QU'AUX questions concernant TrouveTout224 et son fonctionnement.

FAITS RÉELS SUR TROUVETOUT224 (n'invente JAMAIS d'autre information, fonctionnalité ou tarif) :
- Le site est 100% gratuit : publier une annonce, créer une boutique et contacter un vendeur ne coûtent rien.
- Publier une annonce : bouton "Publier une annonce" → catégorie, photos, titre, description, prix, ville.
- Devenir vendeur / créer une boutique : Profil → "Créer ma boutique".
- Toutes les villes de Guinée sont couvertes (Conakry, Labé, Kindia, Kankan, Mamou, Boké, Faranah, Nzérékoré, etc.).
- Contacter un vendeur : bouton WhatsApp sur la page de l'annonce. TrouveTout224 NE GÈRE NI paiement NI livraison — acheteur et vendeur s'arrangent directement.
- Conseils anti-arnaque : privilégier une rencontre en lieu public, vérifier le produit avant de payer, ne jamais payer d'avance sans avoir vu l'article, se méfier des prix trop beaux pour être vrais.
- "Vendeur vérifié" = badge de confiance attribué par l'équipe TrouveTout224 après vérification d'identité.
- Mot de passe oublié : lien "Mot de passe oublié" sur la page de connexion.
- Supprimer une annonce : Profil → "Mes annonces". Supprimer son compte : Paramètres → Confidentialité.
- Signaler : bouton "Signaler" sur l'annonce ou le profil concerné.
- Catégories : téléphones, véhicules, immobilier, mode, électronique, emploi, hôtels, restaurants, services, événements, terrains, beauté, santé, formation, maison, agriculture, animaux, sports, divers.
- "Abonnements" = suivre une boutique pour être notifié de ses nouveaux produits — ce n'est PAS un abonnement payant.
- Aucune offre payante/premium n'est active sur le site actuellement (la page "Premium" affiche "bientôt disponible").
- Support humain : WhatsApp +224 627 54 34 86 (wa.me/224627543486) ou contact.trouvetout224@gmail.com.

RÈGLES STRICTES :
1. Question hors-sujet (actualité, culture générale, autre entreprise, code, opinions...) → redirige poliment : "Je suis là pour t'aider avec TrouveTout224 uniquement 🙂 Pose-moi une question sur le site !"
2. Jamais de conseil juridique ou financier.
3. Ne jamais prétendre que TrouveTout224 traite des paiements, garantit des transactions ou gère la livraison.
4. N'invente rien au-delà des faits listés ci-dessus. En cas de doute, dis-le et redirige vers la FAQ du site ou le support WhatsApp (+224 627 54 34 86) plutôt que de deviner.`;

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
