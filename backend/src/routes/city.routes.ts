import { Router } from 'express';
import { prisma } from '../config/database';
const router = Router();
router.get('/', async (req, res) => {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { annonces: { where: { status: 'ACTIVE' } } } } },
  });
  res.json({ data: cities });
});
export default router;
