import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
const router = Router();

router.get('/', async (req, res) => {
  const { cityId, type, q, page = '1', limit = '20' } = req.query;
  const where: any = { isActive: true };
  if (cityId) where.cityId = cityId;
  if (type) where.type = type;
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { company: { contains: q, mode: 'insensitive' } }];
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({ where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' }, include: { city: true } }),
    prisma.job.count({ where }),
  ]);
  res.json({ data: jobs, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) } });
});

router.get('/:id', async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { city: true, _count: { select: { applications: true } } } });
  if (!job) return res.status(404).json({ error: 'Offre non trouvée.' });
  res.json({ data: job });
});

router.post('/', authenticate, async (req: any, res) => {
  try {
    const job = await prisma.job.create({ data: { ...req.body, salary: req.body.salary ? parseFloat(req.body.salary) : null } });
    res.status(201).json({ message: 'Offre publiée !', data: job });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

router.post('/:id/apply', authenticate, async (req: any, res) => {
  try {
    const { cvUrl, coverLetter } = req.body;
    const app = await prisma.jobApplication.create({
      data: { jobId: req.params.id, userId: req.userId, cvUrl, coverLetter },
    });
    res.status(201).json({ message: 'Candidature envoyée !', data: app });
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Vous avez déjà postulé.' });
    res.status(500).json({ error: 'Erreur.' });
  }
});

export default router;
