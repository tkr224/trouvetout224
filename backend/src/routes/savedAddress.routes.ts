import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { normalizeGuineaPhone, GUINEA_PHONE_FORMAT_HINT } from '../utils/phone';

const router = Router();
router.use(authenticate);

async function resolveCityId(value: string): Promise<string | null> {
  if (!value) return null;
  const byId = await prisma.city.findUnique({ where: { id: value } }).catch(() => null);
  if (byId) return byId.id;
  const byName = await prisma.city.findFirst({ where: { name: value } }).catch(() => null);
  return byName?.id || null;
}

const ADDRESS_INCLUDE = { city: true } as const;

// Adresse par défaut d'abord, puis les plus récentes — c'est cet ordre que le
// sélecteur de la page de publication utilise pour pré-sélectionner la première.
router.get('/me', async (req: any, res) => {
  try {
    const addresses = await prisma.savedAddress.findMany({
      where: { userId: req.userId },
      include: ADDRESS_INCLUDE,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ data: addresses });
  } catch (error) {
    console.error('Erreur GET /saved-addresses/me:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des adresses.' });
  }
});

router.post('/me', async (req: any, res) => {
  try {
    const { label, phone, cityId, neighborhood, isDefault } = req.body;

    const normalizedPhone = normalizeGuineaPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: `Numéro invalide. ${GUINEA_PHONE_FORMAT_HINT}` });
    }
    const realCityId = await resolveCityId(cityId);
    if (!realCityId) {
      return res.status(400).json({ error: 'Ville invalide. Choisissez une ville.' });
    }

    const existingCount = await prisma.savedAddress.count({ where: { userId: req.userId } });
    // La toute première adresse d'un utilisateur devient automatiquement celle par
    // défaut — sinon il faudrait une étape supplémentaire pour en avoir une seule.
    const makeDefault = existingCount === 0 || !!isDefault;

    const address = await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.savedAddress.updateMany({ where: { userId: req.userId, isDefault: true }, data: { isDefault: false } });
      }
      return tx.savedAddress.create({
        data: {
          userId: req.userId,
          label: label?.trim().slice(0, 40) || null,
          phone: normalizedPhone,
          cityId: realCityId,
          neighborhood: neighborhood?.trim().slice(0, 100) || null,
          isDefault: makeDefault,
        },
        include: ADDRESS_INCLUDE,
      });
    }, { timeout: 10000 });

    res.status(201).json({ message: 'Adresse enregistrée.', data: address });
  } catch (error) {
    console.error('Erreur POST /saved-addresses/me:', error);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de l'adresse." });
  }
});

router.put('/me/:id', async (req: any, res) => {
  try {
    const existing = await prisma.savedAddress.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Adresse introuvable.' });

    const { label, phone, cityId, neighborhood, isDefault } = req.body;
    const data: Record<string, any> = {};

    if (label !== undefined) data.label = label?.trim().slice(0, 40) || null;
    if (neighborhood !== undefined) data.neighborhood = neighborhood?.trim().slice(0, 100) || null;
    if (phone !== undefined) {
      const normalizedPhone = normalizeGuineaPhone(phone);
      if (!normalizedPhone) return res.status(400).json({ error: `Numéro invalide. ${GUINEA_PHONE_FORMAT_HINT}` });
      data.phone = normalizedPhone;
    }
    if (cityId !== undefined) {
      const realCityId = await resolveCityId(cityId);
      if (!realCityId) return res.status(400).json({ error: 'Ville invalide. Choisissez une ville.' });
      data.cityId = realCityId;
    }

    const address = await prisma.$transaction(async (tx) => {
      // Passer cette adresse en "par défaut" : on retire d'abord le statut à toutes
      // les autres pour n'en garder qu'une seule à la fois. Décocher directement
      // (isDefault: false) est ignoré si c'était la seule adresse par défaut —
      // il en faut toujours une tant qu'il reste au moins une adresse enregistrée.
      if (isDefault === true) {
        await tx.savedAddress.updateMany({ where: { userId: req.userId, isDefault: true }, data: { isDefault: false } });
        data.isDefault = true;
      }
      return tx.savedAddress.update({ where: { id: req.params.id }, data, include: ADDRESS_INCLUDE });
    }, { timeout: 10000 });

    res.json({ message: 'Adresse mise à jour.', data: address });
  } catch (error) {
    console.error('Erreur PUT /saved-addresses/me/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

router.delete('/me/:id', async (req: any, res) => {
  try {
    const existing = await prisma.savedAddress.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Adresse introuvable.' });

    await prisma.savedAddress.delete({ where: { id: req.params.id } });

    // Si l'adresse supprimée était celle par défaut, promeut la plus récente des
    // adresses restantes — pour ne jamais laisser l'utilisateur sans adresse par
    // défaut tant qu'il lui en reste au moins une.
    if (existing.isDefault) {
      const next = await prisma.savedAddress.findFirst({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
      if (next) await prisma.savedAddress.update({ where: { id: next.id }, data: { isDefault: true } });
    }

    res.json({ message: 'Adresse supprimée.' });
  } catch (error) {
    console.error('Erreur DELETE /saved-addresses/me/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

export default router;
