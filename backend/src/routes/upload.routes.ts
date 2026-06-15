import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/auth';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/image', authenticate, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'trouveTout224', resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      stream.end(req.file!.buffer);
    });

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch { res.status(500).json({ error: 'Erreur upload image.' }); }
});

router.post('/images', authenticate, upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'Aucun fichier reçu.' });

    const uploadPromises = (req.files as Express.Multer.File[]).map((file) =>
      new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'trouveTout224', resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
          (error, result) => { if (error) reject(error); else resolve({ url: result!.secure_url, publicId: result!.public_id }); }
        );
        stream.end(file.buffer);
      })
    );

    const results = await Promise.all(uploadPromises);
    res.json({ images: results });
  } catch { res.status(500).json({ error: 'Erreur upload images.' }); }
});

export default router;
