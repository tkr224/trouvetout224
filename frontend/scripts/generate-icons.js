// Script one-shot : génère les icônes PNG pour la PWA.
// Exécuter avec : node scripts/generate-icons.js (depuis frontend/)
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// ── Icône principale ──────────────────────────────────────────────────────────
// Fond dégradé vert émeraude → vert foncé, coins arrondis, loupe blanche nette.
// Pas de texte "224" : illisible en petite taille.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1B8B3B"/>
      <stop offset="100%" stop-color="#0F5F27"/>
    </linearGradient>
  </defs>
  <!-- Fond carré à coins arrondis -->
  <rect width="512" height="512" rx="112" ry="112" fill="url(#g)"/>
  <!-- Loupe : cercle (lentille) -->
  <circle cx="218" cy="210" r="105" fill="none" stroke="white" stroke-width="52"/>
  <!-- Loupe : manche diagonal -->
  <line x1="301" y1="293" x2="382" y2="374" stroke="white" stroke-width="52" stroke-linecap="round"/>
</svg>`;

// ── Icône maskable ────────────────────────────────────────────────────────────
// Fond plein (sans coins arrondis) pour que l'OS puisse appliquer sa propre forme.
// Contenu légèrement réduit et recentré dans la "safe zone" (cercle des 80%).
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1B8B3B"/>
      <stop offset="100%" stop-color="#0F5F27"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <circle cx="228" cy="220" r="90" fill="none" stroke="white" stroke-width="46"/>
  <line x1="299" y1="291" x2="370" y2="362" stroke="white" stroke-width="46" stroke-linecap="round"/>
</svg>`;

// ── Favicon (32×32 virtuel) ───────────────────────────────────────────────────
// Version minimaliste avec coins légèrement arrondis, loupe lisible à 32px.
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="7" fill="#1B8B3B"/>
  <circle cx="13" cy="12.5" r="6.5" fill="none" stroke="white" stroke-width="3.2"/>
  <line x1="17.6" y1="17.5" x2="22.5" y2="22.5" stroke="white" stroke-width="3.2" stroke-linecap="round"/>
</svg>`;

// ── Image Open Graph 1200×630 ─────────────────────────────────────────────────
// Utilisée pour les partages WhatsApp, Facebook, etc. — le texte y est approprié.
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1B8B3B"/>
      <stop offset="100%" stop-color="#155d28"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
  <circle cx="600" cy="200" r="72" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="28"/>
  <line x1="651" y1="251" x2="710" y2="310" stroke="rgba(255,255,255,0.25)" stroke-width="30" stroke-linecap="round"/>
  <text x="600" y="395" font-family="Arial Black, Arial, sans-serif" font-size="88" font-weight="900" fill="white" text-anchor="middle">TrouveTout224</text>
  <text x="600" y="470" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="rgba(255,255,255,0.88)" text-anchor="middle">La plus grande marketplace de Guinee</text>
  <text x="600" y="535" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#F5C518" text-anchor="middle">Achetez · Vendez · Trouvez a Conakry et partout en Guinee</text>
</svg>`;

async function run() {
  console.log('Generation des icones PWA...\n');

  await sharp(Buffer.from(iconSvg)).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('OK  public/icons/icon-192.png');

  await sharp(Buffer.from(iconSvg)).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('OK  public/icons/icon-512.png');

  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-maskable-512.png'));
  console.log('OK  public/icons/icon-maskable-512.png');

  await sharp(Buffer.from(iconSvg)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('OK  public/apple-touch-icon.png');

  await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('OK  public/favicon-32x32.png');

  await sharp(Buffer.from(ogSvg)).resize(1200, 630).png().toFile(path.join(publicDir, 'og-image.png'));
  console.log('OK  public/og-image.png (OG image conservee)');

  console.log('\nToutes les icones generees avec succes !');
}

run().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
