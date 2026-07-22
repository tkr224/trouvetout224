// user.routes.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { SECURITY_QUESTIONS, normalizeAnswer } from '../constants/securityQuestions';
import { checkCooldown, cooldownMessage } from '../config/security';
import { sendSecurityAlertEmail, sendEmailChangeConfirmation } from '../services/email.service';
import { resolveEmailLocale } from '../i18n/emailLocales';

const router = Router();

// Liste toutes les boutiques actives (avec recherche + filtres)
router.get('/shops', async (req, res) => {
  try {
    const { q = '', cityId = '', category = '', page = '1' } = req.query;
    const take = 20;
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where: any = { shopActive: true };
    if (q) {
      where.shopName = { contains: q as string, mode: 'insensitive' };
    }
    if (cityId) {
      where.cityId = cityId as string;
    }
    if (category) {
      where.shopCategories = { has: category as string };
    }

    const [shops, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true,
          shopName: true, shopLogo: true, shopDescription: true,
          shopCategories: true, shopHasPhysical: true,
          isVerified: true, createdAt: true,
          city: { select: { id: true, name: true } },
          _count: {
            select: {
              annonces: true,
              subscribers: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: shops, pagination: { total, page: parseInt(page as string, 10), pages: Math.ceil(total / take) } });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

// Profil public d'un utilisateur (+ infos boutique si active)
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, firstName: true, lastName: true, avatar: true,
        city: true, isVerified: true, isShopVerified: true, emailVerified: true, createdAt: true,
        shopName: true, shopLogo: true, shopBanner: true, shopDescription: true, shopWhatsapp: true, shopActive: true, shopColor: true, shopSlogan: true,
        _count: { select: { annonces: true, ratingsReceived: true, subscribers: true } },
        ratingsReceived: { select: { score: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    const avg = user.ratingsReceived.length
      ? user.ratingsReceived.reduce((a, r) => a + r.score, 0) / user.ratingsReceived.length
      : 0;
    res.json({ data: { ...user, averageRating: avg } });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Mon profil complet
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { city: true } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    const { password, ...rest } = user;
    res.json({ data: { ...rest, hasPassword: !!password } });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Onboarding gamifié : liste des tâches "bien démarrer" + % de complétion.
// Adapté au type de compte (la tâche "boutique" n'apparaît que pour les
// vendeurs) et à la présence d'un email (la tâche "vérifier email" n'a pas
// de sens pour un compte créé uniquement avec un numéro de téléphone).
router.get('/me/onboarding', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        avatar: true, cityId: true, phone: true, email: true, emailVerified: true,
        accountType: true, shopActive: true, shopLogo: true, shopDescription: true,
        hasViewedAnnonce: true,
        _count: { select: { annonces: true, savedAnnonces: true, securityQuestions: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    const isVendor = user.accountType === 'VENDEUR' || user.accountType === 'LES_DEUX';

    const tasks = [
      { id: 'avatar', label: 'Ajouter une photo de profil', done: !!user.avatar, href: '/profil' },
      { id: 'info', label: 'Compléter vos informations (ville, téléphone)', done: !!user.cityId && !!user.phone, href: '/parametres' },
      user.email ? { id: 'email', label: 'Vérifier votre email', done: user.emailVerified, href: '/profil' } : null,
      { id: 'security', label: 'Configurer vos questions de sécurité', done: user._count.securityQuestions >= 2, href: '/parametres' },
      { id: 'explore', label: 'Explorer les annonces', done: user.hasViewedAnnonce, href: '/annonces/lister' },
      { id: 'favorite', label: 'Ajouter une annonce en favori', done: user._count.savedAnnonces > 0, href: '/annonces/lister' },
      { id: 'first_annonce', label: 'Publier votre première annonce', done: user._count.annonces > 0, href: '/annonces/publier', highlight: true },
      isVendor ? { id: 'shop', label: 'Créer votre boutique', done: !!(user.shopActive && user.shopLogo && user.shopDescription), href: '/vendeur/boutique' } : null,
    ].filter(Boolean) as { id: string; label: string; done: boolean; href: string; highlight?: boolean }[];

    const doneCount = tasks.filter(t => t.done).length;
    const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 100;

    res.json({ data: { percent, tasks, isComplete: percent === 100 } });
  } catch (e) { console.error('Erreur GET /me/onboarding:', e); res.status(500).json({ error: 'Erreur.' }); }
});

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

// Vérifie en direct si un nom d'utilisateur est disponible (utilisé pendant la saisie)
router.get('/username-available', authenticate, async (req: any, res) => {
  try {
    const normalized = String(req.query.username || '').trim().toLowerCase();
    if (!USERNAME_REGEX.test(normalized)) {
      return res.json({ available: false, reason: 'invalid' });
    }
    const existing = await prisma.user.findUnique({ where: { username: normalized } });
    const available = !existing || existing.id === req.userId;
    res.json({ available, reason: available ? null : 'taken' });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Mettre à jour mon profil
router.put('/me', authenticate, async (req: any, res) => {
  try {
    const { firstName, lastName, bio, cityId, avatar, banner, accountType, username, textSize, preferredLanguage } = req.body;

    const data: any = { firstName, lastName, bio, cityId, avatar, banner };

    // Préférence d'affichage (pas sensible, pas de délai de sécurité)
    if (textSize && ['SM', 'BASE', 'LG'].includes(textSize)) {
      data.textSize = textSize;
    }

    // Langue d'interface préférée (i18n) — pas sensible, pas de délai de sécurité
    if (preferredLanguage && ['FR', 'EN', 'ZH'].includes(preferredLanguage)) {
      data.preferredLanguage = preferredLanguage;
    }

    // Nom d'utilisateur : optionnel, mais unique et normalisé si fourni.
    if (typeof username === 'string' && username.trim() !== '') {
      const normalized = username.trim().toLowerCase();
      if (!USERNAME_REGEX.test(normalized)) {
        return res.status(400).json({
          error: "Nom d'utilisateur invalide : 3 à 20 caractères (lettres minuscules, chiffres, _).",
          field: 'username',
        });
      }
      const existing = await prisma.user.findUnique({ where: { username: normalized } });
      if (existing && existing.id !== req.userId) {
        return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris.", field: 'username' });
      }
      data.username = normalized;
    }

    // Choix du type de compte (ex: étape post-inscription Google) : ne touche jamais un rôle admin.
    if (accountType && ['ACHETEUR', 'VENDEUR', 'LES_DEUX'].includes(accountType)) {
      const current = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
      data.accountType = accountType;
      if (current && (current.role === 'USER' || current.role === 'VENDOR')) {
        data.role = accountType === 'VENDEUR' || accountType === 'LES_DEUX' ? 'VENDOR' : 'USER';
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      include: { city: true },
      omit: { password: true },
    });
    res.json({ message: 'Profil mis à jour.', data: user });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris.", field: 'username' });
    }
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Format attendu côté Guinée : 9 chiffres commençant par 6 (ex "620 00 00 00"),
// stocké avec le préfixe international +224.
const GUINEA_PHONE_REGEX = /^6\d{8}$/;

// Ajouter ou modifier mon numéro de téléphone (sert au contact WhatsApp).
// Protégé par le délai de sécurité si un numéro existait déjà (1ère saisie toujours libre).
router.put('/me/phone', authenticate, async (req: any, res) => {
  try {
    const digits = String(req.body?.phone || '').replace(/\D/g, '').replace(/^224/, '');
    if (!GUINEA_PHONE_REGEX.test(digits)) {
      return res.status(400).json({ error: 'Numéro invalide. Format attendu : 6XX XX XX XX (9 chiffres, commence par 6).' });
    }
    const phone = `+224${digits}`;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    if (phone === user.phone) {
      return res.status(400).json({ error: 'Ce numéro est déjà le vôtre.' });
    }

    if (user.phone) {
      const cooldown = checkCooldown(user.phoneChangedAt);
      if (cooldown.blocked) {
        return res.status(403).json({
          error: cooldownMessage(cooldown.daysRemaining, cooldown.nextAllowedAt!),
          code: 'COOLDOWN_ACTIVE',
          nextAllowedAt: cooldown.nextAllowedAt,
        });
      }
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== req.userId) {
      return res.status(409).json({ error: 'Ce numéro est déjà utilisé par un autre compte.' });
    }

    const hadPhoneBefore = !!user.phone;
    await prisma.user.update({ where: { id: req.userId }, data: { phone, phoneChangedAt: new Date() } });

    if (hadPhoneBefore && user.email) {
      sendSecurityAlertEmail(user.email, user.firstName, 'phone', resolveEmailLocale(user.preferredLanguage)).catch(e => console.log('Email alerte non envoyé:', e.message));
    }

    res.json({ message: 'Numéro de téléphone mis à jour.', data: { phone } });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Ce numéro est déjà utilisé par un autre compte.' });
    console.error('Erreur PUT /me/phone:', error);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Demander un changement d'email : envoie un lien de confirmation à la NOUVELLE
// adresse (le changement n'est effectif qu'après avoir cliqué dessus).
router.put('/me/email', authenticate, async (req: any, res) => {
  try {
    const newEmail = String(req.body?.newEmail || '').toLowerCase().trim();
    const { currentPassword } = req.body;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    if (user.password) {
      const isValid = currentPassword && (await bcrypt.compare(currentPassword, user.password));
      if (!isValid) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }

    if (newEmail === user.email?.toLowerCase()) {
      return res.status(400).json({ error: 'Cette adresse est déjà la vôtre.' });
    }

    if (user.email) {
      const cooldown = checkCooldown(user.emailChangedAt);
      if (cooldown.blocked) {
        return res.status(403).json({
          error: cooldownMessage(cooldown.daysRemaining, cooldown.nextAllowedAt!),
          code: 'COOLDOWN_ACTIVE',
          nextAllowedAt: cooldown.nextAllowedAt,
        });
      }
    }

    const takenByOther = await prisma.user.findFirst({
      where: { email: { equals: newEmail, mode: 'insensitive' }, id: { not: req.userId } },
    });
    if (takenByOther) {
      return res.status(409).json({ error: 'Cette adresse email est déjà utilisée par un autre compte.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        pendingEmail: newEmail,
        pendingEmailToken: token,
        pendingEmailExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });

    const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirmer-email?token=${token}`;
    sendEmailChangeConfirmation(newEmail, user.firstName, confirmUrl, resolveEmailLocale(user.preferredLanguage)).catch(e => console.log('Email non envoyé:', e.message));

    res.json({ message: `Un lien de confirmation a été envoyé à ${newEmail}. Cliquez dessus pour valider le changement.` });
  } catch (error) {
    console.error('Erreur PUT /me/email:', error);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// Mes questions de sécurité configurées (jamais les réponses — juste question + label)
router.get('/me/security-questions', authenticate, async (req: any, res) => {
  try {
    const rows = await prisma.userSecurityQuestion.findMany({
      where: { userId: req.userId },
      select: { questionId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const data = rows.map(r => ({
      questionId: r.questionId,
      label: SECURITY_QUESTIONS.find(q => q.id === r.questionId)?.label || r.questionId,
    }));
    res.json({ data });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Configurer / remplacer mes questions de sécurité (2 ou 3 obligatoirement)
router.put('/me/security-questions', authenticate, async (req: any, res) => {
  try {
    const items = req.body?.questions;
    if (!Array.isArray(items) || items.length < 2 || items.length > 3) {
      return res.status(400).json({ error: 'Choisissez entre 2 et 3 questions de sécurité.' });
    }

    const me = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, firstName: true, securityQuestionsChangedAt: true, preferredLanguage: true, _count: { select: { securityQuestions: true } } },
    });
    if (!me) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    // Délai de sécurité seulement si des questions étaient déjà configurées (1ère config toujours libre).
    if (me._count.securityQuestions > 0) {
      const cooldown = checkCooldown(me.securityQuestionsChangedAt);
      if (cooldown.blocked) {
        return res.status(403).json({
          error: cooldownMessage(cooldown.daysRemaining, cooldown.nextAllowedAt!),
          code: 'COOLDOWN_ACTIVE',
          nextAllowedAt: cooldown.nextAllowedAt,
        });
      }
    }

    const seen = new Set<string>();
    for (const it of items) {
      const qid = it?.questionId;
      const answer = typeof it?.answer === 'string' ? it.answer.trim() : '';
      if (!SECURITY_QUESTIONS.some(q => q.id === qid)) {
        return res.status(400).json({ error: 'Question invalide.' });
      }
      if (seen.has(qid)) {
        return res.status(400).json({ error: 'Choisissez des questions différentes les unes des autres.' });
      }
      seen.add(qid);
      if (answer.length < 2) {
        return res.status(400).json({ error: 'Chaque réponse doit contenir au moins 2 caractères.' });
      }
    }

    const hashed = await Promise.all(items.map(async (it: any) => ({
      questionId: it.questionId as string,
      answerHash: await bcrypt.hash(normalizeAnswer(it.answer), 10),
    })));

    await prisma.$transaction([
      prisma.userSecurityQuestion.deleteMany({ where: { userId: req.userId } }),
      prisma.userSecurityQuestion.createMany({
        data: hashed.map(h => ({ userId: req.userId, questionId: h.questionId, answerHash: h.answerHash })),
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: { securityQuestionsFailedAttempts: 0, securityQuestionsLockedUntil: null, securityQuestionsChangedAt: new Date() },
      }),
    ]);

    if (me.email) {
      sendSecurityAlertEmail(me.email, me.firstName, 'securityQuestions', resolveEmailLocale(me.preferredLanguage)).catch(e => console.log('Email alerte non envoyé:', e.message));
    }

    res.json({ message: 'Questions de sécurité enregistrées.' });
  } catch { res.status(500).json({ error: "Erreur lors de l'enregistrement." }); }
});

// Mettre à jour / créer ma boutique
router.put('/me/shop', authenticate, async (req: any, res) => {
  try {
    const {
      shopName, shopLogo, shopBanner, shopDescription, shopWhatsapp, shopActive,
      shopCategories, shopHasPhysical, shopAddress, shopHours, shopColor, shopSlogan,
    } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        shopName, shopLogo, shopBanner, shopDescription, shopWhatsapp, shopActive,
        shopCategories: shopCategories ?? undefined,
        shopHasPhysical: shopHasPhysical ?? undefined,
        shopAddress, shopHours,
        shopColor: shopColor ?? undefined,
        shopSlogan: shopSlogan ?? undefined,
      },
      omit: { password: true },
    });
    res.json({ message: 'Boutique mise à jour.', data: user });
  } catch { res.status(500).json({ error: 'Erreur.' }); }
});

// Supprimer ma boutique (et toutes ses annonces)
router.delete('/me/shop', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;

    // Récupère les IDs de toutes les annonces du vendeur
    const annonces = await prisma.annonce.findMany({
      where: { userId },
      select: { id: true },
    });
    const annonceIds = annonces.map(a => a.id);

    if (annonceIds.length > 0) {
      // Supprime les favoris liés à ces annonces
      await prisma.savedAnnonce.deleteMany({ where: { annonceId: { in: annonceIds } } });
      // Détache les signalements (on les conserve mais sans lien vers l'annonce)
      await prisma.report.updateMany({ where: { annonceId: { in: annonceIds } }, data: { annonceId: null } });
      // Détache les conversations (on les conserve avec leur historique de messages)
      await prisma.conversation.updateMany({ where: { annonceId: { in: annonceIds } }, data: { annonceId: null } });
      // Supprime les annonces (les images cascadent automatiquement via onDelete: Cascade)
      await prisma.annonce.deleteMany({ where: { userId } });
    }

    // Réinitialise tous les champs boutique de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: {
        shopActive: false,
        shopName: null,
        shopLogo: null,
        shopBanner: null,
        shopDescription: null,
        shopWhatsapp: null,
        shopCategories: [],
        shopHasPhysical: false,
        shopAddress: null,
        shopHours: null,
        shopColor: 'vert',
        shopSlogan: null,
      },
    });

    res.json({ message: 'Boutique supprimée avec succès.' });
  } catch (e) {
    console.error('Erreur suppression boutique:', e);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

// Calcul du niveau vendeur
function computeSellerLevel(opts: {
  createdAt: Date;
  totalAnnonces: number;
  subscribersCount: number;
  avgRating: number;
}): { label: string; color: string; emoji: string } {
  const ageDays = (Date.now() - opts.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays >= 180 && opts.totalAnnonces >= 20 && (opts.subscribersCount >= 20 || opts.avgRating >= 4)) {
    return { label: 'Top Vendeur', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', emoji: '🏆' };
  }
  if (ageDays >= 90 && opts.totalAnnonces >= 5 && opts.subscribersCount >= 3) {
    return { label: 'Vendeur Pro', color: 'text-purple-700 bg-purple-50 border-purple-200', emoji: '⭐' };
  }
  if (ageDays >= 30 && opts.totalAnnonces >= 1) {
    return { label: 'Vendeur Actif', color: 'text-primary-700 bg-primary-50 border-primary-200', emoji: '✅' };
  }
  return { label: 'Nouveau Vendeur', color: 'text-blue-700 bg-blue-50 border-blue-200', emoji: '🆕' };
}

// Statistiques du vendeur (tableau de bord)
router.get('/me/stats', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;

    // Toutes mes annonces (+ catégorie pour la répartition)
    const annonces = await prisma.annonce.findMany({
      where: { userId },
      select: {
        id: true, title: true, viewCount: true, status: true, createdAt: true,
        isPinned: true, promoPrice: true, promoEndsAt: true,
        images: { take: 1 },
        category: { select: { id: true, nameFr: true } },
        _count: { select: { conversations: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { viewCount: 'desc' }],
    });

    const totalAnnonces = annonces.length;
    const activeAnnonces = annonces.filter(a => a.status === 'ACTIVE').length;
    const totalViews = annonces.reduce((sum, a) => sum + (a.viewCount || 0), 0);

    // Contacts totaux (conversations initiées sur mes annonces)
    const totalContacts = annonces.reduce((sum, a) => sum + ((a as any)._count?.conversations || 0), 0);

    // Favoris reçus
    const annonceIds = annonces.map(a => a.id);
    const totalFavoris = annonceIds.length
      ? await prisma.savedAnnonce.count({ where: { annonceId: { in: annonceIds } } })
      : 0;

    // Messages reçus (total)
    const totalMessages = await prisma.message.count({
      where: {
        senderId: { not: userId },
        conversation: { participants: { some: { id: userId } } },
      },
    });

    // Note moyenne
    const ratings = await prisma.rating.findMany({ where: { ratedId: userId }, select: { score: true } });
    const avgRating = ratings.length ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length : 0;

    // Abonnés
    const subscribersCount = await prisma.shopSubscription.count({ where: { vendorId: userId } });

    // Niveau vendeur
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    const sellerLevel = computeSellerLevel({
      createdAt: me!.createdAt,
      totalAnnonces,
      subscribersCount,
      avgRating,
    });

    // Top 5 les plus vues (après tri, les épinglées apparaissent en premier dans allAnnonces)
    const topAnnonces = [...annonces].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

    // === NOUVELLES STATS ===

    // 1. Répartition par statut
    const byStatus = {
      active:    annonces.filter(a => a.status === 'ACTIVE').length,
      expired:   annonces.filter(a => a.status === 'EXPIRED').length,
      suspended: annonces.filter(a => ['SUSPENDED', 'PENDING_REVIEW', 'SOLD'].includes(a.status)).length,
    };

    // 2. Répartition par catégorie (top 6)
    const categoryMap: Record<string, number> = {};
    annonces.forEach(a => {
      const name = a.category?.nameFr || 'Autre';
      categoryMap[name] = (categoryMap[name] || 0) + 1;
    });
    const byCategory = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 3. Activité sur 7 jours (messages reçus par jour comme proxy d'engagement)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [recentMessages, prevWeekMessages] = await Promise.all([
      prisma.message.findMany({
        where: {
          senderId: { not: userId },
          createdAt: { gte: sevenDaysAgo },
          conversation: { participants: { some: { id: userId } } },
        },
        select: { createdAt: true },
      }),
      prisma.message.count({
        where: {
          senderId: { not: userId },
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
          conversation: { participants: { some: { id: userId } } },
        },
      }),
    ]);

    const viewsByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      return {
        day: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        date: start.toISOString().split('T')[0],
        count: recentMessages.filter(m => {
          const md = new Date(m.createdAt);
          return md >= start && md <= end;
        }).length,
      };
    });

    // 4. Toutes mes annonces (par date desc, pour la section "Mes annonces")
    const allAnnonces = [...annonces].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      data: {
        totalAnnonces, activeAnnonces, totalViews, totalFavoris, totalMessages, totalContacts,
        avgRating: Number(avgRating.toFixed(1)), ratingsCount: ratings.length,
        subscribersCount, sellerLevel,
        topAnnonces, byStatus, byCategory, viewsByDay, allAnnonces,
        weeklyMessages: recentMessages.length, prevWeekMessages,
      },
    });
  } catch (e) {
    console.error('Erreur stats:', e);
    res.status(500).json({ error: 'Erreur.' });
  }
});

// ── Statistiques de ventes du vendeur ────────────────────────────────────────

router.get('/me/sales-stats', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [total, thisMonth, thisWeek, topProducts] = await Promise.all([
      prisma.annonce.aggregate({
        where: { userId, status: 'SOLD', soldPrice: { not: null } },
        _sum: { soldPrice: true }, _count: { id: true },
      }),
      prisma.annonce.aggregate({
        where: { userId, status: 'SOLD', soldAt: { gte: startOfMonth }, soldPrice: { not: null } },
        _sum: { soldPrice: true }, _count: { id: true },
      }),
      prisma.annonce.aggregate({
        where: { userId, status: 'SOLD', soldAt: { gte: startOfWeek }, soldPrice: { not: null } },
        _sum: { soldPrice: true }, _count: { id: true },
      }),
      prisma.annonce.findMany({
        where: { userId, status: 'SOLD', soldPrice: { not: null } },
        orderBy: { soldPrice: 'desc' },
        take: 5,
        select: { id: true, slug: true, title: true, soldPrice: true, soldAt: true, images: { take: 1, select: { url: true } } },
      }),
    ]);

    res.json({
      data: {
        total: { revenue: total._sum.soldPrice || 0, count: total._count.id },
        thisMonth: { revenue: thisMonth._sum.soldPrice || 0, count: thisMonth._count.id },
        thisWeek: { revenue: thisWeek._sum.soldPrice || 0, count: thisWeek._count.id },
        topProducts,
      },
    });
  } catch { res.status(500).json({ error: 'Erreur serveur.' }); }
});

export default router;