// Script jetable — à exécuter une seule fois :
//   cd frontend && node scripts/generate-maskable-192.js
// Génère l'icône maskable 192x192 requise par le manifest PWA à partir de
// la source maskable 512x512 existante (redimensionnement simple, la zone
// de sécurité maskable est déjà correcte dans la source).
const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, '..', 'public', 'icons', 'icon-maskable-512.png');
const dest = path.join(__dirname, '..', 'public', 'icons', 'icon-maskable-192.png');

sharp(src)
  .resize(192, 192, { fit: 'contain' })
  .png()
  .toFile(dest)
  .then(() => console.log('✔ icon-maskable-192.png écrit dans', dest))
  .catch((err) => { console.error(err); process.exit(1); });
