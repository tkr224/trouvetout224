import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import {
  register,
  login,
  refreshToken,
  logout,
  oauthLogin,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  confirmEmailChange,
  resendVerificationEmail,
  getSecurityQuestionsList,
  startSecurityQuestionRecovery,
  verifySecurityQuestionRecovery,
} from '../controllers/auth.controller';

const router = Router();

// Anti force-brute : max 8 tentatives ÉCHOUÉES par IP sur 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  skipSuccessfulRequests: true,
  message: { error: 'Trop de tentatives échouées. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/register',
  [
    body('firstName').notEmpty().trim().withMessage('Prénom requis'),
    body('lastName').notEmpty().trim().withMessage('Nom requis'),
    body('password')
      .isLength({ min: 8 }).withMessage('Mot de passe : 8 caractères minimum')
      .matches(/[A-Z]/).withMessage('Mot de passe : au moins une majuscule requise')
      .matches(/[a-z]/).withMessage('Mot de passe : au moins une minuscule requise')
      .matches(/[0-9]/).withMessage('Mot de passe : au moins un chiffre requis'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
    body('phone').optional().isMobilePhone('any').withMessage('Téléphone invalide'),
    body().custom((_, { req }) => {
      if (!req.body.email && !req.body.phone) {
        throw new Error('Un email ou un numéro de téléphone est requis.');
      }
      return true;
    }),
  ],
  validate,
  register
);

router.post(
  '/login',
  loginLimiter,
  [body('identifier').notEmpty().trim(), body('password').notEmpty()],
  validate,
  login
);

router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/oauth', oauthLogin);
router.put(
  '/change-password',
  authenticate,
  [
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Mot de passe : 8 caractères minimum')
      .matches(/[A-Z]/).withMessage('Mot de passe : au moins une majuscule requise')
      .matches(/[a-z]/).withMessage('Mot de passe : au moins une minuscule requise')
      .matches(/[0-9]/).withMessage('Mot de passe : au moins un chiffre requis'),
  ],
  validate,
  changePassword
);

// Anti-abus : max 5 demandes de réinitialisation par IP sur 15 min
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [body('identifier').notEmpty().trim().withMessage('Identifiant requis.')],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token requis.'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Mot de passe : 8 caractères minimum')
      .matches(/[A-Z]/).withMessage('Mot de passe : au moins une majuscule requise')
      .matches(/[a-z]/).withMessage('Mot de passe : au moins une minuscule requise')
      .matches(/[0-9]/).withMessage('Mot de passe : au moins un chiffre requis'),
  ],
  validate,
  resetPassword
);

router.post(
  '/verify-email',
  [body('token').notEmpty().withMessage('Token requis.')],
  validate,
  verifyEmail
);

router.post(
  '/confirm-email-change',
  [body('token').notEmpty().withMessage('Token requis.')],
  validate,
  confirmEmailChange
);

// Liste publique des questions de sécurité proposées
router.get('/security-questions', getSecurityQuestionsList);

// Anti-abus : max 10 par IP sur 15 min pour la récupération par questions de sécurité
// (en plus du verrouillage par compte après 5 échecs, voir auth.controller.ts)
const securityQuestionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/forgot-password/security-questions',
  securityQuestionsLimiter,
  [body('identifier').notEmpty().trim().withMessage('Identifiant requis.')],
  validate,
  startSecurityQuestionRecovery
);

router.post(
  '/forgot-password/verify-security-questions',
  securityQuestionsLimiter,
  [
    body('token').notEmpty().withMessage('Token requis.'),
    body('answers').isArray({ min: 2, max: 3 }).withMessage('Réponses invalides.'),
  ],
  validate,
  verifySecurityQuestionRecovery
);

// Anti-abus : max 5 renvois par IP sur 15 min (en plus du cooldown de 60s par compte)
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/resend-verification',
  resendVerificationLimiter,
  optionalAuthenticate,
  resendVerificationEmail
);

export default router;
