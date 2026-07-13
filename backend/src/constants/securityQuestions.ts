// Liste prédéfinie des questions de sécurité proposées à l'inscription / dans les paramètres.
// L'utilisateur en choisit 2 ou 3 et y répond — utilisé pour récupérer un compte
// sans accès à l'email (fréquent en Guinée). Ne jamais stocker les réponses en clair :
// voir user.routes.ts (hash bcrypt) et auth.controller.ts (vérification).

export interface SecurityQuestion {
  id: string;
  label: string;
}

export const SECURITY_QUESTIONS: SecurityQuestion[] = [
  { id: 'BIRTH_CITY', label: 'Quelle est votre ville de naissance ?' },
  { id: 'FAVORITE_DISH', label: 'Quel est votre plat préféré ?' },
  { id: 'FIRST_PET', label: 'Quel est le nom de votre premier animal de compagnie ?' },
  { id: 'CHILDHOOD_BEST_FRIEND', label: "Quel est le prénom de votre meilleur(e) ami(e) d'enfance ?" },
  { id: 'PRIMARY_SCHOOL', label: 'Quel est le nom de votre école primaire ?' },
  { id: 'CHILDHOOD_NICKNAME', label: 'Quel était votre surnom d\'enfance ?' },
  { id: 'FAVORITE_FOOTBALL_TEAM', label: 'Quelle est votre équipe de football préférée ?' },
  { id: 'FATHER_JOB', label: 'Quel est (ou était) le métier de votre père ?' },
  { id: 'MOTHER_JOB', label: 'Quel est (ou était) le métier de votre mère ?' },
  { id: 'PATERNAL_GRANDMOTHER', label: 'Quel est le prénom de votre grand-mère paternelle ?' },
  { id: 'MATERNAL_GRANDMOTHER', label: 'Quel est le prénom de votre grand-mère maternelle ?' },
  { id: 'FAVORITE_COLOR', label: 'Quelle est votre couleur préférée ?' },
  { id: 'CHILDHOOD_NEIGHBORHOOD', label: "Quel est le nom de votre quartier d'enfance ?" },
  { id: 'FIRST_TEACHER', label: 'Quel est le prénom de votre tout premier professeur ?' },
  { id: 'FAVORITE_MOVIE', label: 'Quel est votre film préféré ?' },
  { id: 'MOTHER_MAIDEN_NAME', label: 'Quel est le nom de jeune fille de votre mère ?' },
  { id: 'PARENTS_MEETING_CITY', label: 'Dans quelle ville vos parents se sont-ils rencontrés ?' },
  { id: 'FAVORITE_UNCLE', label: 'Quel est le prénom de votre oncle ou tante préféré(e) ?' },
  { id: 'FAVORITE_ARTIST', label: 'Quel est votre chanteur ou artiste préféré ?' },
  { id: 'FIRST_VEHICLE_BRAND', label: 'Quelle est la marque de votre première voiture ou moto ?' },
  { id: 'DREAM_SHOP_NAME', label: 'Si vous ouvriez une boutique, quel nom lui donneriez-vous ?' },
  { id: 'BEST_VACATION_MEMORY', label: 'Quel est le lieu de votre meilleur souvenir de vacances ?' },
  { id: 'CHILDHOOD_CRUSH', label: "Quel est le prénom de votre premier amoureux ou première amoureuse d'enfance ?" },
  { id: 'FAVORITE_SEASON', label: 'Quelle est votre saison préférée ?' },
  { id: 'FAVORITE_PROVERB', label: 'Quel est votre proverbe ou dicton préféré ?' },
];

export const SECURITY_QUESTION_IDS = SECURITY_QUESTIONS.map(q => q.id);

export function getQuestionLabel(id: string): string {
  return SECURITY_QUESTIONS.find(q => q.id === id)?.label || id;
}

// Normalise une réponse avant hash/comparaison : insensible à la casse et aux espaces superflus.
export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}
