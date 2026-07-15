// Script one-shot : génère des dégradés de marque en secours pour les cartes catégories.
// Exécuter avec : node scripts/generate-category-images.js (depuis frontend/)
//
// ⚠️ public/images/categories/ contient désormais de vraies photos (voir
// image-credits.json). Ne relancez ce script que si vous voulez régénérer
// un placeholder pour une catégorie sans photo — il écrase le fichier .jpg
// correspondant.
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Couleurs alignées sur backend/src/seeds/seed.ts (mêmes catégories, même identité visuelle)
const categories = [
  { slug: 'telephones',   color: '#3B82F6' },
  { slug: 'informatique', color: '#8B5CF6' },
  { slug: 'electronique', color: '#EC4899' },
  { slug: 'vehicules',    color: '#F59E0B' },
  { slug: 'immobilier',   color: '#10B981' },
  { slug: 'terrains',     color: '#6B7280' },
  { slug: 'emplois',      color: '#0EA5E9' },
  { slug: 'services',     color: '#F97316' },
  { slug: 'restaurants',  color: '#EF4444' },
  { slug: 'hotels',       color: '#A855F7' },
  { slug: 'mode',         color: '#EC4899' },
  { slug: 'chaussures',   color: '#14B8A6' },
  { slug: 'beaute',       color: '#F43F5E' },
  { slug: 'sante',        color: '#22C55E' },
  { slug: 'formation',    color: '#3B82F6' },
  { slug: 'evenements',   color: '#F59E0B' },
  { slug: 'maison',       color: '#84CC16' },
  { slug: 'agriculture',  color: '#65A30D' },
  { slug: 'animaux',      color: '#FB923C' },
  { slug: 'sports',       color: '#06B6D4' },
  { slug: 'divers',       color: '#9CA3AF' },
];

const outDir = path.join(__dirname, '..', 'public', 'images', 'categories');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function clamp(n) { return Math.max(0, Math.min(255, n)); }
function shade(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0xff) + amount);
  const b = clamp((num & 0xff) + amount);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function svgFor(color) {
  const dark = shade(color, -55);
  const light = shade(color, 55);
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${dark}"/>
      </linearGradient>
      <radialGradient id="b1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${light}" stop-opacity="0.65"/>
        <stop offset="100%" stop-color="${light}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="b2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <circle cx="640" cy="110" r="260" fill="url(#b1)"/>
    <circle cx="60" cy="540" r="230" fill="url(#b2)"/>
    <circle cx="740" cy="560" r="150" fill="${dark}" opacity="0.30"/>
    <g opacity="0.10" fill="#ffffff">
      ${Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 8 }).map((__, c) =>
          `<circle cx="${40 + c * 105}" cy="${40 + r * 105}" r="3"/>`
        ).join('')
      ).join('')}
    </g>
  </svg>`;
}

async function generate() {
  for (const cat of categories) {
    const file = path.join(outDir, `${cat.slug}.jpg`);
    await sharp(Buffer.from(svgFor(cat.color)))
      .jpeg({ quality: 72, mozjpeg: true })
      .toFile(file);
    const kb = (fs.statSync(file).size / 1024).toFixed(1);
    console.log(`✅ ${cat.slug}.jpg (${kb} Ko)`);
  }
}

generate();
