import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAnnonces,
  getAnnonceById,
  createAnnonce,
  updateAnnonce,
  deleteAnnonce,
  getMyAnnonces,
  toggleSaveAnnonce,
  getSavedAnnonces,
  checkSaved,
  getSimilarAnnonces,
} from '../controllers/annonce.controller';

const router = Router();

router.get('/', getAnnonces);
router.get('/me', authenticate, getMyAnnonces);
router.get('/saved', authenticate, getSavedAnnonces);
router.get('/:id', getAnnonceById);
router.get('/:id/saved', authenticate, checkSaved);
router.get('/:id/similaires', getSimilarAnnonces);
router.post('/', authenticate, createAnnonce);
router.put('/:id', authenticate, updateAnnonce);
router.delete('/:id', authenticate, deleteAnnonce);
router.post('/:id/save', authenticate, toggleSaveAnnonce);

export default router;