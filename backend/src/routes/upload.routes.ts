import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// ── Types MIME images autorisés ─────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/gif', 'image/heic', 'image/heif',
];

// ── Signatures magiques (premiers octets) pour vérification réelle du contenu
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg':  [[0xFF, 0xD8, 0xFF]],
  'image/png':   [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif':   [[0x47, 0x49, 0x46, 0x38]],
  'image/webp':  [[0x52, 0x49, 0x46, 0x46]], // RIFF....WEBP — vérif partielle
  'image/heic':  [[0x00, 0x00, 0x00]], // En-tête HEIC variable, on se fie au MIME
  'image/heif':  [[0x00, 0x00, 0x00]],
};

function hasValidMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signatures = MAGIC_BYTES[mimetype];
  if (!signatures) return false;
  // Pour HEIC/HEIF : les magic bytes varient, on accepte si MIME est correct
  if (['image/heic', 'image/heif', 'image/jpg'].includes(mimetype)) return true;
  return signatures.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

// ── Filtre multer : vérification MIME déclaré ────────────────────────────
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé : ${file.mimetype}. Seules les images sont acceptées.`));
  }
};

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,  // 8 MB max (réduit de 10 MB)
    files: 10,
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Rate limiter uploads ─────────────────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 60,                   // 60 images par heure par IP
  message: { error: 'Trop d\'uploads. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Upload image unique ─────────────────────────────────────────────────
router.post('/image', authenticate, uploadLimiter, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });

    // Vérification des magic bytes (le MIME déclaré peut être falsifié)
    if (!hasValidMagicBytes(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ error: 'Fichier invalide ou corrompu.' });
    }

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'trouveTout224',
          resource_type: 'image',
          // Refuse les fichiers non-image même si Cloudinary les reçoit
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'],
          transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1920, crop: 'limit' }],
        },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      stream.end(req.file!.buffer);
    });

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err: any) {
    if (err.message?.includes('non autorisé')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erreur upload image.' });
  }
});

// ── Upload multiple images ──────────────────────────────────────────────
router.post('/images', authenticate, uploadLimiter, upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || !(req.files as Express.Multer.File[]).length) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const files = req.files as Express.Multer.File[];

    // Vérification magic bytes sur tous les fichiers
    for (const file of files) {
      if (!hasValidMagicBytes(file.buffer, file.mimetype)) {
        return res.status(400).json({ error: `Fichier invalide : ${file.originalname}` });
      }
    }

    const uploadPromises = files.map((file) =>
      new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'trouveTout224',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'],
            transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1920, crop: 'limit' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({ url: result!.secure_url, publicId: result!.public_id });
          }
        );
        stream.end(file.buffer);
      })
    );

    const results = await Promise.all(uploadPromises);
    res.json({ images: results });
  } catch (err: any) {
    if (err.message?.includes('non autorisé')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erreur upload images.' });
  }
});

export default router;
