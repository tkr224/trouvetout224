// Vérification avec la VRAIE IA (Gemini) — nécessite GEMINI_API_KEY.
// N'écrit rien en base : affiche seulement ce que l'IA rédigerait.
// Lancer : GEMINI_API_KEY=... npx ts-node --transpile-only tests/release-ai-live.ts
import 'dotenv/config';
import { generateReleaseAnnouncementRaw, isAiConfigured } from '../src/services/gemini.service';
import { filterCandidateCommits, buildReleasePrompt, validateGenerated } from '../src/services/release/releaseCore';

const SCENARIOS: { name: string; commits: string[]; expectVisible: boolean }[] = [
  {
    name: '1 visible + 1 technique',
    commits: [
      'feat(je-cherche): section « Je cherche » — un acheteur publie ce qu\'il cherche (budget, ville, photo) et les vendeurs répondent publiquement sous la demande',
      'refactor(auth): extrait la vérification des tokens JWT dans un service dédié, ajoute des logs',
    ],
    expectVisible: true,
  },
  {
    name: '100 % technique',
    commits: [
      'refactor(db): ajoute des index sur la table messages et renomme une variable interne',
      'fix(security): vérifie l\'appartenance à la conversation côté serveur (IDOR)',
      'chore(deps): mise à jour de prisma',
    ],
    expectVisible: false,
  },
];

(async () => {
  if (!isAiConfigured()) {
    console.log('GEMINI_API_KEY absente : test avec la vraie IA impossible ici (à lancer là où la clé est configurée).');
    return;
  }
  let fails = 0;
  for (const s of SCENARIOS) {
    const commits = filterCandidateCommits(s.commits);
    const raw = commits.length ? await generateReleaseAnnouncementRaw(buildReleasePrompt(commits, null)) : JSON.stringify({ visible: false });
    const v = validateGenerated(raw);
    const visible = v.ok && v.value.visible;
    const ok = v.ok && visible === s.expectVisible;
    if (!ok) fails++;
    console.log(`\n${ok ? 'OK  ' : 'FAIL'} ${s.name} (attendu : ${s.expectVisible ? 'annonce' : 'aucune annonce'})`);
    console.log(v.ok ? (visible ? `  « ${v.value.title} »\n  ${v.value.message}\n  [${v.value.buttonText}] → ${v.value.buttonLink}` : '  → aucune annonce') : `  refusé : ${v.errors.join(' ; ')}\n  brut : ${String(raw).slice(0, 300)}`);
  }
  console.log(fails ? `\n${fails} échec(s)` : '\nIA conforme aux consignes');
  process.exitCode = fails ? 1 : 0;
})();
