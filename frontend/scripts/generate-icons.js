// Script one-shot : génère les icônes PNG pour la PWA.
// Exécuter avec : node scripts/generate-icons.js (depuis frontend/)
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Icône principale (fond dégradé arrondi + loupe + "224")
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1B8B3B"/>
      <stop offset="100%" stop-color="#F5C518"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" ry="96" fill="url(#g)"/>
  <circle cx="218" cy="210" r="108" fill="none" stroke="white" stroke-width="44"/>
  <line x1="302" y1="294" x2="398" y2="392" stroke="white" stroke-width="50" stroke-linecap="round"/>
  <text x="218" y="258" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="110" font-weight="900" fill="white" text-anchor="middle">224</text>
</svg>`;

// Icône maskable (fond plein, contenu dans zone sure 80%)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1B8B3B"/>
      <stop offset="100%" stop-color="#F5C518"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <circle cx="234" cy="224" r="88" fill="none" stroke="white" stroke-width="36"/>
  <line x1="302" y1="294" x2="374" y2="368" stroke="white" stroke-width="40" stroke-linecap="round"/>
  <text x="234" y="264" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="88" font-weight="900" fill="white" text-anchor="middle">224</text>
</svg>`;

// Image Open Graph (1200x630) pour WhatsApp, Facebook, etc.
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

  await sharp(Buffer.from(ogSvg)).resize(1200, 630).png().toFile(path.join(publicDir, 'og-image.png'));
  console.log('OK  public/og-image.png');

  console.log('\nToutes les images generees avec succes !');
}

run().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
