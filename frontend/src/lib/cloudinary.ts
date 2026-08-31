// Applique une transformation Cloudinary (redimensionnement + qualité/format
// automatiques) aux URLs de vignettes/cartes, pour ne jamais charger l'image en
// pleine résolution là où une petite miniature suffit — coûteux en data mobile.
// Ne touche pas aux URLs non-Cloudinary (avatars Google, placeholders, etc.),
// et n'affecte jamais les images en grand format (détail annonce, galeries).
export function cloudinaryThumb(url: string, width = 480): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto,c_fill/`);
}
