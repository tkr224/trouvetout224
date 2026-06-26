import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
const router = Router();

const JOB_SECTORS = [
  'VENTE', 'RESTAURATION', 'BTP', 'BUREAUTIQUE', 'CHAUFFEUR',
  'SECURITE', 'SANTE', 'EDUCATION', 'INFORMATIQUE', 'AUTRE',
];

// ─── Liste des offres (publique) ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { cityId, type, sector, q, page = '1', limit = '20' } = req.query;
  const where: any = { status: 'ACTIVE', isActive: true };
  if (cityId) where.cityId = cityId;
  if (type) where.type = type;
  if (sector) where.sector = sector;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where, skip, take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);
  res.json({ data: jobs, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) } });
});

// ─── Mes offres publiées (employeur) ─────────────────────────────────────────
router.get('/mes-offres', authenticate, async (req: any, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { ownerId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        _count: { select: { applications: true } },
      },
    });
    res.json({ data: jobs });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// ─── Détail d'une offre ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      city: true,
      owner: { select: { id: true, firstName: true, lastName: true, shopName: true } },
      _count: { select: { applications: true } },
    },
  });
  if (!job) return res.status(404).json({ error: 'Offre non trouvée.' });
  res.json({ data: job });
});

// ─── Candidatures pour une offre (employeur) ─────────────────────────────────
router.get('/:id/candidatures', authenticate, async (req: any, res) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job || job.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const applications = await prisma.jobApplication.findMany({
      where: { jobId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
      },
    });
    res.json({ data: applications });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// ─── Publier une offre ────────────────────────────────────────────────────────
router.post('/', authenticate, async (req: any, res) => {
  try {
    const {
      title, description, company, sector, cityId, neighborhood,
      type, salary, salaryMax, salaryNegotiable, currency,
      experience, education, phone, whatsapp, email, deadline, howToApply, schedule,
    } = req.body;

    if (!title || !description || !company || !cityId) {
      return res.status(400).json({ error: 'Titre, description, entreprise et ville sont requis.' });
    }

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        company: company.trim(),
        sector: sector || null,
        cityId,
        neighborhood: neighborhood?.trim() || null,
        type: type || 'FULL_TIME',
        salary: salary ? parseFloat(salary) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        salaryNegotiable: !!salaryNegotiable,
        currency: currency || 'GNF',
        experience: experience?.trim() || null,
        education: education?.trim() || null,
        phone: phone?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        email: email?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        howToApply: howToApply?.trim() || null,
        schedule: schedule?.trim() || null,
        ownerId: req.userId,
        status: 'PENDING_REVIEW',
      },
    });
    res.status(201).json({ message: 'Offre soumise — en attente de validation.', data: job });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la publication.' });
  }
});

// ─── Postuler à une offre ─────────────────────────────────────────────────────
router.post('/:id/apply', authenticate, async (req: any, res) => {
  try {
    const { cvUrl, coverLetter } = req.body;
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job || job.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Offre introuvable ou inactive.' });
    }
    const app = await prisma.jobApplication.create({
      data: { jobId: req.params.id, userId: req.userId, cvUrl: cvUrl?.trim() || null, coverLetter: coverLetter?.trim() || null },
    });

    // Notifier l'employeur si l'offre a un owner
    if (job.ownerId) {
      await prisma.notification.create({
        data: {
          userId: job.ownerId,
          type: 'SYSTEM' as any,
          title: 'Nouvelle candidature reçue',
          body: `Quelqu'un a postulé à votre offre "${job.title}".`,
          data: { jobId: job.id },
        },
      }).catch(() => {});
    }

    res.status(201).json({ message: 'Candidature envoyée !', data: app });
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Vous avez déjà postulé à cette offre.' });
    res.status(500).json({ error: 'Erreur.' });
  }
});

// ─── Mettre à jour le statut d'une candidature ───────────────────────────────
router.put('/:jobId/candidatures/:appId/status', authenticate, async (req: any, res) => {
  try {
    const { status } = req.body;
    const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
    if (!job || job.ownerId !== req.userId) return res.status(403).json({ error: 'Accès refusé.' });
    const app = await prisma.jobApplication.update({
      where: { id: req.params.appId },
      data: { status },
    });
    res.json({ data: app });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

export default router;
