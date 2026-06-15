import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  register,
  login,
  refreshToken,
  logout,
  oauthLogin,
  changePassword,
} from '../controllers/auth.controller';

const router = Router();

router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('Prénom requis'),
    body('lastName').notEmpty().withMessage('Nom requis'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe: 6 caractères minimum'),
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('phone').optional().isMobilePhone('any').withMessage('Téléphone invalide'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [body('identifier').notEmpty(), body('password').notEmpty()],
  validate,
  login
);

router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/oauth', oauthLogin);
router.put('/change-password', authenticate, changePassword);

export default router;
